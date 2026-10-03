export const SKILL_NAMES = ["role_matcher", "format_checker", "cv_scorer", "cv_editor"] as const;
export type SkillName = (typeof SKILL_NAMES)[number];

/**
 * Contexto de uma requisição: o CV atual e quais skills já tiveram o SKILL.md
 * carregado via `load_skill` (nesta requisição ou em turnos anteriores — a rota
 * reconstrói o conjunto a partir do histórico de mensagens).
 */
export type SkillContext = { cv: string; loaded: Set<SkillName> };

/** Toda tool de skill chama isto primeiro: sem carregar as instruções, não executa. */
export function requireLoaded(ctx: SkillContext, name: SkillName) {
  if (!ctx.loaded.has(name)) {
    throw new Error(
      `A skill "${name}" ainda não foi carregada. Chame load_skill({ name: "${name}" }) primeiro, leia as instruções e só então execute a tool.`,
    );
  }
}
