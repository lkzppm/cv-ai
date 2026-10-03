import { tool } from "ai";
import { z } from "zod";
import { loadSkillDoc } from "../registry";

/**
 * cv_editor: o próprio modelo escreve o novo Markdown como *input* da tool.
 * A execução apenas valida e devolve a proposta; a UI mostra um card com
 * "Aplicar" e atualiza o painel principal + histórico de versões.
 */
export function createCvEditor(ctx: { cv: string }) {
  const doc = loadSkillDoc("cv_editor");
  return tool({
    description: doc.description,
    inputSchema: z.object({
      newCv: z.string().min(50).describe("O CV COMPLETO atualizado, em Markdown"),
      summary: z.array(z.string()).min(1).max(6).describe("O que mudou, em bullets curtos"),
    }),
    execute: async ({ newCv, summary }) => {
      const before = ctx.cv.split(/\s+/).filter(Boolean).length;
      const after = newCv.split(/\s+/).filter(Boolean).length;
      return {
        newCv,
        summary,
        stats: { wordsBefore: before, wordsAfter: after, delta: after - before },
      };
    },
  });
}
