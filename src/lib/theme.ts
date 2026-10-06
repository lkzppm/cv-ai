"use client";

export type Theme = "light" | "dark";

/** Duração do fade entre temas; a mesma está em `globals.css` (`html.theme-fade`). */
export const THEME_FADE_MS = 550;

/** Aplica o tema no <html> na hora (classe `.dark` + `color-scheme`). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

let fadeTimer = 0;

/**
 * Troca de tema com fade: liga no <html> a transição das variáveis de cor
 * (`theme-fade`, em globals.css), aplica o tema e desliga quando termina. Como
 * quem interpola são as próprias variáveis, texto e fundo mudam aos poucos junto
 * com o resto, em qualquer navegador com @property.
 *
 * Não usa View Transitions: o crossfade por foto da página funcionava no
 * Chromium e no WebKit de teste, mas no Safari real texto e fundo trocavam de
 * uma vez. O fundo WebGPU faz o mesmo fade pelo uniform `dark` (papers.ts).
 */
export function transitionTheme(update: () => void) {
  const root = document.documentElement;
  window.clearTimeout(fadeTimer);
  root.classList.add("theme-fade");
  update();
  fadeTimer = window.setTimeout(() => root.classList.remove("theme-fade"), THEME_FADE_MS + 80);
}
