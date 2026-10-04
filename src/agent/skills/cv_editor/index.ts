import { tool } from "ai";
import { z } from "zod";
import { changedLineRefs } from "@/lib/cv/refs";
import { requireLoaded, type SkillContext } from "../context";
import { loadSkillDoc } from "../registry";

/**
 * cv_editor: o próprio modelo escreve o novo Markdown como *input* da tool.
 * A execução apenas valida e devolve a proposta; a UI mostra um card com
 * "Aplicar" e atualiza o painel principal + histórico de versões.
 */
export function createCvEditor(ctx: SkillContext) {
  const doc = loadSkillDoc("cv_editor");
  return tool({
    description: doc.description,
    inputSchema: z.object({
      newCv: z.string().min(50).describe("O CV COMPLETO atualizado, em Markdown"),
      summary: z.array(z.string()).min(1).max(6).describe("O que mudou, em bullets curtos"),
    }),
    execute: async ({ newCv, summary }) => {
      requireLoaded(ctx, "cv_editor");
      const before = ctx.cv.split(/\s+/).filter(Boolean).length;
      const after = newCv.split(/\s+/).filter(Boolean).length;
      return {
        newCv,
        summary,
        stats: { wordsBefore: before, wordsAfter: after, delta: after - before },
        // Trechos do CV atual que mudam/somem: a UI destaca "o que vai ser alterado" antes de aplicar.
        changed: changedLineRefs(ctx.cv, newCv),
      };
    },
    // Não devolve o CV inteiro ao modelo (ele já o escreveu); só confirma a proposta.
    toModelOutput: ({ output }) => ({
      type: "json",
      value: {
        proposed: true,
        summary: output.summary,
        stats: output.stats,
        note: "Proposta exibida no card; o usuário decide clicar em Aplicar.",
      },
    }),
  });
}
