import { generateText, tool } from "ai";
import { z } from "zod";
import { groq, searchModel } from "@/agent/models";
import { fetchPageText } from "@/lib/web/fetch-page";
import { loadSkillDoc } from "../registry";

export const roleMatchSchema = z.object({
  roles: z.array(
    z.object({
      url: z.string().nullish(),
      title: z.string(),
      company: z.string().nullish(),
      seniority: z.string().nullish(),
      mustHave: z.array(z.string()),
      niceToHave: z.array(z.string()),
      atsKeywords: z.array(z.string()),
      marketInsights: z.array(z.string()),
      sources: z.array(z.object({ title: z.string(), url: z.string() })),
    }),
  ),
  match: z.object({
    score: z.number().min(0).max(100),
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
});
export type RoleMatchResult = z.infer<typeof roleMatchSchema>;

const JSON_FENCE = /```(?:json)?\s*([\s\S]*?)```/i;
function extractJson<T>(text: string): T | null {
  const candidate = JSON_FENCE.exec(text)?.[1] ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

/** Uma rodada de pesquisa usando a built-in tool `browser_search` da Groq. */
async function searchRound(prompt: string) {
  const result = await generateText({
    model: searchModel(),
    tools: { browser_search: groq.tools.browserSearch({}) },
    toolChoice: "auto",
    prompt,
    providerOptions: { groq: { reasoningEffort: "low" } },
  });
  const sources = (await result.sources)
    .filter((s): s is Extract<typeof s, { sourceType: "url" }> => s.sourceType === "url")
    .map((s) => ({ title: s.title ?? s.url, url: s.url }));
  return { text: result.text, sources };
}

export function createRoleMatcher(ctx: { cv: string }) {
  const doc = loadSkillDoc("role_matcher");
  return tool({
    description: doc.description,
    inputSchema: z.object({
      jobUrls: z.array(z.string().url()).nullish().describe("Links das vagas (LinkedIn, Gupy, etc.)"),
      roleQuery: z
        .string()
        .nullish()
        .describe("Cargo/empresa desejados quando não há link, ex.: 'Engenheiro de Dados Pleno em fintech'"),
    }),
    execute: async ({ jobUrls: urls, roleQuery }) => {
      // gpt-oss envia `null` em campos opcionais; normalizamos aqui.
      const jobUrls = urls ?? [];
      if (jobUrls.length === 0 && !roleQuery) {
        throw new Error("Informe ao menos um link de vaga ou um cargo-alvo.");
      }
      const targets = jobUrls.length ? jobUrls : [roleQuery!];
      const rounds: { label: string; text: string; sources: { title: string; url: string }[] }[] = [];

      for (const target of targets.slice(0, 3)) {
        const isUrl = /^https?:\/\//.test(target);
        // Rodada 0: fetch direto da página (pode falhar no LinkedIn)
        const page = isUrl ? await fetchPageText(target) : null;

        // Rodada 1: descrição da vaga
        const r1 = await searchRound(
          `Você é um recrutador técnico. ${
            page
              ? `Aqui está o texto da página da vaga (${target}):\n\n${page}\n\nSe faltar algo, pesquise na web.`
              : `Pesquise na web a vaga: ${target}. Se o link estiver bloqueado, busque pelo título/empresa que aparecem na URL.`
          }\n\nExtraia: título, empresa, senioridade, requisitos obrigatórios, desejáveis, responsabilidades e palavras-chave que um ATS procuraria. Responda em português, em markdown conciso.`,
        );
        rounds.push({ label: `vaga:${target}`, ...r1 });

        // Rodada 2: mercado para esse cargo
        const r2 = await searchRound(
          `Com base nesta vaga:\n\n${r1.text.slice(0, 3000)}\n\nPesquise na web (fontes de 2025-2026) o que o mercado brasileiro e global espera para esse cargo: skills mais pedidas, certificações, ferramentas, faixa de senioridade e keywords de ATS. Liste de 8 a 15 pontos objetivos em português.`,
        );
        rounds.push({ label: `mercado:${target}`, ...r2 });
      }

      // Síntese estruturada (sem browser search; só raciocínio sobre as rodadas)
      const synthesis = await generateText({
        model: searchModel(),
        providerOptions: { groq: { reasoningEffort: "medium" } },
        prompt: `Você é um especialista em recrutamento e ATS.

### Rodadas de pesquisa
${rounds.map((r) => `#### ${r.label}\n${r.text}\nFontes: ${r.sources.map((s) => s.url).join(", ") || "n/a"}`).join("\n\n")}

### CV atual do usuário
${ctx.cv || "(vazio)"}

Produza APENAS um JSON válido (sem comentários) com o formato:
{
  "roles": [{ "url": "", "title": "", "company": "", "seniority": "", "mustHave": [], "niceToHave": [], "atsKeywords": [], "marketInsights": [], "sources": [{"title":"","url":""}] }],
  "match": { "score": 0-100, "matched": [], "missing": [], "suggestions": [] }
}
Regras: "matched" = requisitos que o CV já evidencia; "missing" = requisitos ausentes ou fracos; "suggestions" = ações concretas (reescrever bullet X, adicionar keyword Y, estudar Z). Em português.`,
      });

      const parsed = extractJson<RoleMatchResult>(synthesis.text);
      const validated = parsed ? roleMatchSchema.safeParse(parsed) : null;
      if (!validated?.success) {
        return {
          ok: false as const,
          raw: synthesis.text,
          rounds: rounds.map((r) => ({ label: r.label, sources: r.sources })),
        };
      }
      // Garante que as fontes das rodadas apareçam
      const allSources = rounds.flatMap((r) => r.sources);
      for (const role of validated.data.roles) {
        if (role.sources.length === 0) role.sources = allSources.slice(0, 6);
      }
      return { ok: true as const, ...validated.data, roundsRun: rounds.length };
    },
    // Fontes e texto bruto ficam só no card; o modelo recebe requisitos + match.
    toModelOutput: ({ output }) => ({
      type: "json",
      value: output.ok
        ? {
            ok: true,
            roles: output.roles.map((r) => ({
              title: r.title,
              company: r.company ?? null,
              seniority: r.seniority ?? null,
              mustHave: r.mustHave,
              niceToHave: r.niceToHave.slice(0, 8),
              atsKeywords: r.atsKeywords.slice(0, 25),
            })),
            match: output.match,
          }
        : { ok: false, note: "A síntese não validou; o card mostra o texto bruto.", raw: output.raw.slice(0, 1500) },
    }),
  });
}
