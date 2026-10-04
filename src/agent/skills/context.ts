export const SKILL_NAMES = ["role_matcher", "format_checker", "cv_scorer", "cv_editor"] as const;
export type SkillName = (typeof SKILL_NAMES)[number];

/**
 * Contexto de uma requisição: o CV atual e quais skills já tiveram o SKILL.md
 * carregado via `load_skill` (nesta requisição ou em turnos anteriores — a rota
 * reconstrói o conjunto a partir do histórico de mensagens).
 */
export type SkillContext = { cv: string; loaded: Set<SkillName> };

/**
 * Toda tool de skill chama isto primeiro. Gate "macio" (2026-10-04): se o
 * agente chamou a tool sem `load_skill`, a skill é carregada aqui mesmo e a
 * função devolve `true`; a tool inclui `autoLoaded` no output, o modelo recebe
 * as instruções de apresentação junto com o resultado e o card mostra o aviso.
 *
 * Por que não bloquear: com `activeTools` a tool ficava fora de `request.tools`
 * e, quando o gpt-oss a chamava mesmo assim, a Groq rejeitava a geração inteira
 * com 400 ("attempted to call tool 'cv_editor' which was not in request.tools")
 * — erro irrecuperável no meio do stream.
 */
export function requireLoaded(ctx: SkillContext, name: SkillName): boolean {
  if (ctx.loaded.has(name)) return false;
  ctx.loaded.add(name);
  return true;
}
