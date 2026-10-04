"use client";

/**
 * Leva o usuário do painel do CV até a referência correspondente no chat.
 *
 * `key` é a identidade do item (`highlightKey`), gravada pelo `<Highlightable>`
 * em `data-hl-key`; `toolCallId` identifica o card da tool (`data-tool-call`).
 * Se o card estiver recolhido, abre antes de rolar. O alvo pisca brevemente.
 */
export function revealInChat(key?: string, toolCallId?: string) {
  const card = toolCallId ? document.querySelector<HTMLElement>(`[data-tool-call="${CSS.escape(toolCallId)}"]`) : null;
  const closedTrigger = card?.querySelector<HTMLButtonElement>('button[data-state="closed"]');
  if (closedTrigger) closedTrigger.click();

  // Dá um frame para o colapsável montar o conteúdo.
  window.setTimeout(() => {
    const target =
      (key ? document.querySelector<HTMLElement>(`[data-hl-key="${CSS.escape(key)}"]`) : null) ?? card;
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    target.classList.remove("hl-flash");
    // Reinicia a animação mesmo se já estava aplicada.
    void target.offsetWidth;
    target.classList.add("hl-flash");
    target.addEventListener("animationend", () => target.classList.remove("hl-flash"), { once: true });
  }, closedTrigger ? 60 : 0);
}
