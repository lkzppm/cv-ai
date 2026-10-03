import { SKILL_NAMES, type SkillContext } from "./context";
import { createCvEditor } from "./cv_editor";
import { createCvScorer } from "./cv_scorer";
import { createFormatChecker } from "./format_checker";
import { createLoadSkill } from "./load_skill";
import { loadSkillDoc, renderSkillsForPrompt } from "./registry";
import { createRoleMatcher } from "./role_matcher";

export { SKILL_NAMES, requireLoaded, type SkillContext, type SkillName } from "./context";

/** Instancia as tools de todas as skills (+ load_skill), fechando sobre o contexto da requisição. */
export function createSkills(ctx: SkillContext) {
  return {
    load_skill: createLoadSkill(ctx),
    role_matcher: createRoleMatcher(ctx),
    format_checker: createFormatChecker(ctx),
    cv_scorer: createCvScorer(ctx),
    cv_editor: createCvEditor(ctx),
  };
}
export type Skills = ReturnType<typeof createSkills>;

export function skillsPromptBlock() {
  return renderSkillsForPrompt(SKILL_NAMES.map(loadSkillDoc));
}
