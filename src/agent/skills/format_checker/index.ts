import { generateObject, tool } from "ai";
import { z } from "zod";
import { skillModel } from "@/agent/models";
import { hasSection, parseCv, type ParsedCv } from "@/lib/cv/parse";
import { requireLoaded, type SkillContext } from "../context";
import { loadSkillDoc } from "../registry";

export const checkSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  detail: z.string(),
  standard: z.string().describe("Padrão de mercado que motiva a checagem"),
});
export type FormatCheck = z.infer<typeof checkSchema>;

const qualitativeSchema = z.object({
  checks: z.array(checkSchema),
  topFixes: z.array(z.string()).max(3),
});

function deterministicChecks(cv: ParsedCv): FormatCheck[] {
  const checks: FormatCheck[] = [];
  const push = (c: FormatCheck) => checks.push(c);

  push({
    id: "contact",
    label: "Contato completo no topo",
    status: cv.email && (cv.phone || cv.linkedin) ? "pass" : cv.email || cv.phone ? "warn" : "fail",
    detail: `e-mail: ${cv.email ?? "—"} · telefone: ${cv.phone ?? "—"} · LinkedIn: ${cv.linkedin ?? "—"}`,
    standard: "Harvard/ATS: nome, e-mail, telefone e LinkedIn no cabeçalho",
  });
  push({
    id: "name",
    label: "Nome identificado como título",
    status: cv.name ? "pass" : "fail",
    detail: cv.name ? `Nome: ${cv.name}` : "Não foi possível identificar o nome na primeira linha / H1",
    standard: "Nome em destaque na primeira linha",
  });
  for (const [kind, label] of [
    ["experience", "Seção de Experiência"],
    ["education", "Seção de Educação"],
    ["skills", "Seção de Habilidades"],
  ] as const) {
    push({
      id: `section-${kind}`,
      label,
      status: hasSection(cv, kind) ? "pass" : "fail",
      detail: hasSection(cv, kind) ? "Presente" : "Ausente — títulos convencionais ajudam o ATS a classificar o conteúdo",
      standard: "ATS: seções com nomes convencionais",
    });
  }
  push({
    id: "summary",
    label: "Resumo profissional",
    status: hasSection(cv, "summary") ? "pass" : "warn",
    detail: hasSection(cv, "summary") ? "Presente" : "Opcional, mas 2–3 linhas de resumo aumentam a leitura em 6s do recrutador",
    standard: "Resumo de 2–3 linhas orientado ao cargo-alvo",
  });
  push({
    id: "length",
    label: "Tamanho (palavras / páginas)",
    status: cv.wordCount < 250 ? "warn" : cv.wordCount > 1100 ? "fail" : cv.wordCount > 800 ? "warn" : "pass",
    detail: `${cv.wordCount} palavras ≈ ${cv.estimatedPages} página(s). Ideal: 400–700 palavras, no máximo 2 páginas`,
    standard: "1 página até ~5 anos de experiência; 2 no máximo",
  });
  push({
    id: "dates",
    label: "Datas nas experiências",
    status: cv.hasDates ? "pass" : "fail",
    detail: cv.hasDates ? "Datas encontradas" : "Nenhuma data encontrada — recrutadores e ATS precisam do período de cada cargo",
    standard: "Formato Mês AAAA – Mês AAAA, do mais recente ao mais antigo",
  });
  const total = cv.bullets.length || 1;
  const verbRatio = cv.actionVerbBullets / total;
  push({
    id: "action-verbs",
    label: "Bullets começam com verbo de ação",
    status: cv.bullets.length === 0 ? "fail" : verbRatio >= 0.7 ? "pass" : verbRatio >= 0.4 ? "warn" : "fail",
    detail: `${cv.actionVerbBullets}/${cv.bullets.length} bullets iniciam com verbo de ação (${Math.round(verbRatio * 100)}%)`,
    standard: "Fórmula Verbo + o quê + como + resultado",
  });
  const quantRatio = cv.quantifiedBullets / total;
  push({
    id: "quantified",
    label: "Resultados quantificados",
    status: cv.bullets.length === 0 ? "fail" : quantRatio >= 0.5 ? "pass" : quantRatio >= 0.25 ? "warn" : "fail",
    detail: `${cv.quantifiedBullets}/${cv.bullets.length} bullets têm números, % ou volume`,
    standard: "Impacto mensurável em pelo menos metade dos bullets",
  });
  push({
    id: "first-person",
    label: "Sem primeira pessoa",
    status: cv.firstPersonHits === 0 ? "pass" : cv.firstPersonHits <= 2 ? "warn" : "fail",
    detail: `${cv.firstPersonHits} ocorrência(s) de "eu/meu/I/my"`,
    standard: "Tom impessoal e direto",
  });
  return checks;
}

export function createFormatChecker(ctx: SkillContext) {
  const doc = loadSkillDoc("format_checker");
  return tool({
    description: doc.description,
    inputSchema: z.object({
      focus: z
        .string()
        .nullish()
        .describe("Opcional: aspecto específico a verificar (ex.: 'ATS', 'tamanho', 'bullets')"),
    }),
    execute: async ({ focus }) => {
      requireLoaded(ctx, "format_checker");
      if (!ctx.cv.trim()) throw new Error("O CV está vazio. Peça ao usuário para colar ou enviar o currículo.");
      const parsed = parseCv(ctx.cv);
      const deterministic = deterministicChecks(parsed);

      const { object: qualitative } = await generateObject({
        model: skillModel(),
        schema: qualitativeSchema,
        prompt: `${doc.instructions}

Avalie QUALITATIVAMENTE o CV abaixo (as checagens determinísticas já cobrem contato, seções, tamanho, datas, verbos, quantificação e primeira pessoa — NÃO repita essas).
Produza de 3 a 6 checagens com id em kebab-case, sobre: ordem das seções, consistência de formato de datas/pontuação, clareza dos títulos de cargo, redundância/ruído, elementos que quebram ATS (tabelas, colunas, ícones), adequação de linguagem${focus ? `, com foco especial em: ${focus}` : ""}.
Em "topFixes", as 3 correções de maior impacto, em português.

### CV
${ctx.cv}`,
      });

      const checks = [...deterministic, ...qualitative.checks];
      const score = Math.round(
        (checks.reduce((acc, c) => acc + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0) / checks.length) * 100,
      );
      return {
        score,
        summary: {
          pass: checks.filter((c) => c.status === "pass").length,
          warn: checks.filter((c) => c.status === "warn").length,
          fail: checks.filter((c) => c.status === "fail").length,
        },
        stats: {
          words: parsed.wordCount,
          pages: parsed.estimatedPages,
          bullets: parsed.bullets.length,
          sections: parsed.sections.map((s) => s.title),
        },
        checks,
        topFixes: qualitative.topFixes,
      };
    },
    // O card recebe o output completo; o modelo só vê o resumo (economia de tokens).
    toModelOutput: ({ output }) => ({
      type: "json",
      value: {
        score: output.score,
        summary: output.summary,
        words: output.stats.words,
        pages: output.stats.pages,
        issues: output.checks
          .filter((c) => c.status !== "pass")
          .map((c) => `${c.status.toUpperCase()} · ${c.label}: ${c.detail}`),
        topFixes: output.topFixes,
      },
    }),
  });
}
