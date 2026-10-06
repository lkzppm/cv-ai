"use client";

export type Theme = "light" | "dark";

/** Aplica o tema no <html> na hora (classe `.dark` + `color-scheme`). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

type ViewTransition = { ready: Promise<void>; finished: Promise<void> };
type TransitionDocument = Document & { startViewTransition?: (update: () => void) => ViewTransition };

const REVEAL_MS = 620;
const FADE_MS = 420;

/**
 * Troca de tema animada: o tema novo se abre num círculo a partir de `origin`
 * (o botão do header), por cima de uma foto do tema antigo (View Transitions).
 *
 * `update` precisa mudar o DOM de forma síncrona: o navegador fotografa o
 * estado novo assim que ela retorna. Era esse o bug da troca "seca": a classe
 * `.dark` só entrava depois, num `useEffect`, e a transição comparava duas
 * fotos iguais.
 *
 * Sem a API, cai para um fade das cores por CSS; com `prefers-reduced-motion`,
 * troca direto.
 */
export function transitionTheme(update: () => void, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const doc = document as TransitionDocument;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return update();

  if (!doc.startViewTransition) {
    root.classList.add("theme-fade");
    update();
    window.setTimeout(() => root.classList.remove("theme-fade"), FADE_MS + 60);
    return;
  }

  const x = origin?.x ?? window.innerWidth;
  const y = origin?.y ?? 0;
  // Raio até o canto mais distante: o círculo termina cobrindo a tela inteira.
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  // `theme-reveal` desliga o crossfade padrão (globals.css); a animação é o clip-path abaixo.
  root.classList.add("theme-reveal");
  const transition = doc.startViewTransition(update);
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    // Transição pulada (aba oculta, outra em andamento): o tema já foi aplicado por `update`.
    .catch(() => {});
  void transition.finished.finally(() => root.classList.remove("theme-reveal"));
}
