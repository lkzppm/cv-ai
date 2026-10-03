import { createCvEditor } from "./cv_editor";
import { createCvScorer } from "./cv_scorer";
import { createFormatChecker } from "./format_checker";
import { loadSkillDoc, renderSkillsForPrompt } from "./registry";
import { createRoleMatcher } from "./role_matcher";

export const SKILL_NAMES = ["role_matcher", "format_checker", "cv_scorer", "cv_editor"] as const;
export type SkillName = (typeof SKILL_NAMES)[number];

export type SkillContext = { cv: string };

/** Instancia as tools de todas as skills, fechando sobre o CV da sessão. */
export function createSkills(ctx: SkillContext) {
  return {
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
