import { generateObject, tool } from "ai";
import { z } from "zod";
import { agentModel } from "@/agent/models";
import { parseCv } from "@/lib/cv/parse";
import { loadSkillDoc } from "../registry";

export const scoreSchema = z.object({
  overall: z.number().min(0).max(100),
  verdict: z.string().describe("Uma frase de diagnóstico"),
  dimensions: z.array(
    z.object({
      name: z.enum(["Impacto", "Clareza", "Relevância", "Estrutura", "Keywords/ATS", "Consistência"]),
      score: z.number().min(0).max(100),
      weight: z.number(),
      rationale: z.string(),
    }),
  ),
  strengths: z.array(z.string()).max(5),
  weaknesses: z.array(z.string()).max(5),
  improvementPlan: z.array(
    z.object({
      priority: z.number().int().min(1),
      section: z.string(),
      action: z.string(),
      example: z.string().optional().describe("Exemplo reescrito, se aplicável"),
    }),
  ).max(5),
  missingKeywords: z.array(z.string()).max(15),
});
export type CvScore = z.infer<typeof scoreSchema>;

const WEIGHTS: Record<CvScore["dimensions"][number]["name"], number> = {
  Impacto: 25,
  Clareza: 15,
  Relevância: 20,
  Estrutura: 15,
  "Keywords/ATS": 15,
  Consistência: 10,
};

export function createCvScorer(ctx: { cv: string }) {
  const doc = loadSkillDoc("cv_scorer");
  return tool({
    description: doc.description,
    inputSchema: z.object({
      targetRole: z.string().optional().describe("Cargo-alvo para a dimensão Relevância, ex.: 'Engenheira de Software Pleno'"),
      jobKeywords: z.array(z.string()).optional().describe("Keywords vindas do role_matcher, se já executado"),
    }),
    execute: async ({ targetRole, jobKeywords }) => {
      if (!ctx.cv.trim()) throw new Error("O CV está vazio. Peça ao usuário para colar ou enviar o currículo.");
      const parsed = parseCv(ctx.cv);

      const { object } = await generateObject({
        model: agentModel(),
        schema: scoreSchema,
        prompt: `${doc.instructions}

Você é um avaliador rigoroso de currículos (recrutador sênior + especialista em ATS). Avalie o CV abaixo com a rubrica acima.
${targetRole ? `Cargo-alvo: ${targetRole}.` : "Sem cargo-alvo: avalie Relevância pela coerência da trajetória."}
${jobKeywords?.length ? `Keywords da vaga: ${jobKeywords.join(", ")}.` : ""}

Dados extraídos automaticamente (use como evidência):
- ${parsed.wordCount} palavras, ~${parsed.estimatedPages} página(s), ${parsed.bullets.length} bullets
- ${parsed.actionVerbBullets} bullets com verbo de ação, ${parsed.quantifiedBullets} quantificados
- Seções: ${parsed.sections.map((s) => s.title).join(" | ") || "nenhuma detectada"}

Regras: use os pesos ${JSON.stringify(WEIGHTS)}; seja específico (cite trechos); respostas em português; "example" deve ser um bullet reescrito real quando a ação for reescrever.

### CV
${ctx.cv}`,
      });

      // Recalcula a nota geral pelos pesos para garantir consistência
      const weighted = object.dimensions.reduce((acc, d) => acc + d.score * (WEIGHTS[d.name] ?? d.weight), 0) /
        object.dimensions.reduce((acc, d) => acc + (WEIGHTS[d.name] ?? d.weight), 0);
      const overall = Math.round(weighted);
      const band =
        overall >= 85 ? "pronto para vagas competitivas" : overall >= 70 ? "bom, ajustes pontuais" : overall >= 50 ? "precisa de revisão estrutural" : "reescrever com apoio do cv_editor";

      return { ...object, overall, band, dimensions: object.dimensions.map((d) => ({ ...d, weight: WEIGHTS[d.name] ?? d.weight })) };
    },
  });
}
