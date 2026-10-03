import { tool } from "ai";
import { z } from "zod";
import { SKILL_NAMES, type SkillContext } from "../context";
import { loadSkillDoc } from "../registry";

/** Seções do SKILL.md que só interessam às chamadas internas da skill (não ao agente). */
const INTERNAL_SECTION = /^## (como funciona|padr(ões|oes) de refer)/i;

function agentRelevant(body: string) {
  return body
    .split(/^(?=## )/m)
    .filter((p) => !INTERNAL_SECTION.test(p.trim()))
    .join("")
    .trim();
}

/**
 * load_skill: carregamento progressivo (padrão "Agent Skills").
 * O system prompt só lista nome + descrição + quando usar; o SKILL.md completo
 * (regras, rubrica, como apresentar) entra no contexto quando o agente decide
 * usar a skill. Aceita várias skills de uma vez para economizar passos.
 * A UI recebe o documento inteiro; o modelo recebe só as seções que o orientam.
 */
export function createLoadSkill(ctx: SkillContext) {
  return tool({
    description:
      "Carrega as instruções completas (SKILL.md) de uma ou mais skills. Obrigatório antes de executar a tool de cada skill pela primeira vez na conversa. Carregue de uma vez todas as que vai usar nesta resposta.",
    inputSchema: z.object({
      names: z.array(z.enum(SKILL_NAMES)).min(1).describe("Skills a carregar, ex.: [\"format_checker\", \"cv_scorer\"]"),
    }),
    execute: async ({ names }) => {
      const skills = [...new Set(names)].map((name) => {
        const alreadyLoaded = ctx.loaded.has(name);
        ctx.loaded.add(name);
        const doc = loadSkillDoc(name);
        return { name, alreadyLoaded, description: doc.description, instructions: doc.instructions };
      });
      return { skills };
    },
    toModelOutput: ({ output }) => ({
      type: "json",
      value: {
        skills: output.skills.map((s) => ({ name: s.name, instructions: agentRelevant(s.instructions) })),
      },
    }),
  });
}
