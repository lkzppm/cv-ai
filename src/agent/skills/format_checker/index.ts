import { generateObject, tool } from "ai";
import { z } from "zod";
import { skillModel } from "@/agent/models";
import { FIRST_PERSON_RE, hasSection, isQuantified, parseCv, startsWithActionVerb, type ParsedCv } from "@/lib/cv/parse";
import { headerRef, quoteRefs, sectionRef, type CvRef } from "@/lib/cv/refs";
import { requireLoaded, type SkillContext } from "../context";
import { loadSkillDoc } from "../registry";

export const checkSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  detail: z.string(),
  standard: z.string().describe("Padrão de mercado que motiva a checagem"),
});
/** Checagem + referências aos trechos do CV que ela aponta (a UI destaca no painel). */
export type FormatCheck = z.infer<typeof checkSchema> & { refs: CvRef[] };

const qualitativeSchema = z.object({
  checks: z.array(
    checkSchema.extend({
      evidence: z
        .array(z.string())
        .max(3)
        .describe("Trechos do CV copiados EXATAMENTE (bullet, linha de cargo ou frase) que motivam a checagem; [] se não houver"),
    }),
  ),
  topFixes: z.array(z.string()).max(3),
});

function deterministicChecks(cv: ParsedCv, raw: string): FormatCheck[] {
  const checks: FormatCheck[] = [];
  const push = (c: Omit<FormatCheck, "refs"> & { refs?: CvRef[] }) => checks.push({ refs: [], ...c });
  const section = (kind: Parameters<typeof hasSection>[1]) => {
    const s = cv.sections.find((x) => x.normalized === kind);
    return s ? [sectionRef(s.title)] : [];
  };

  push({
    id: "contact",
    label: "Contato completo no topo",
    status: cv.email && (cv.phone || cv.linkedin) ? "pass" : cv.email || cv.phone ? "warn" : "fail",
    detail: `e-mail: ${cv.email ?? "—"} · telefone: ${cv.phone ?? "—"} · LinkedIn: ${cv.linkedin ?? "—"}`,
    standard: "Harvard/ATS: nome, e-mail, telefone e LinkedIn no cabeçalho",
    refs: [headerRef()],
  });
  push({
    id: "name",
    label: "Nome identificado como título",
    status: cv.name ? "pass" : "fail",
    detail: cv.name ? `Nome: ${cv.name}` : "Não foi possível identificar o nome na primeira linha / H1",
    standard: "Nome em destaque na primeira linha",
    refs: [headerRef()],
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
      refs: section(kind),
    });
  }
  push({
    id: "summary",
    label: "Resumo profissional",
    status: hasSection(cv, "summary") ? "pass" : "warn",
    detail: hasSection(cv, "summary") ? "Presente" : "Opcional, mas 2–3 linhas de resumo aumentam a leitura em 6s do recrutador",
    standard: "Resumo de 2–3 linhas orientado ao cargo-alvo",
    refs: section("summary"),
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
    refs: section("experience"),
  });
  // Verbo de ação e quantificação valem para bullets de realização (experiência/projetos),
  // não para listas de habilidades/idiomas. Sem essas seções, cai para todos os bullets.
  const achievement = cv.sections.filter((s) => s.normalized === "experience" || s.normalized === "projects").flatMap((s) => s.bullets);
  const bullets = achievement.length ? achievement : cv.bullets;
  const total = bullets.length || 1;
  const withVerb = bullets.filter(startsWithActionVerb);
  const verbRatio = withVerb.length / total;
  push({
    id: "action-verbs",
    label: "Bullets começam com verbo de ação",
    status: bullets.length === 0 ? "fail" : verbRatio >= 0.7 ? "pass" : verbRatio >= 0.4 ? "warn" : "fail",
    detail: `${withVerb.length}/${bullets.length} bullets de experiência iniciam com verbo de ação (${Math.round(verbRatio * 100)}%)`,
    standard: "Fórmula Verbo + o quê + como + resultado",
    refs: quoteRefs(bullets.filter((b) => !startsWithActionVerb(b)), 6),
  });
  const quantified = bullets.filter(isQuantified);
  const quantRatio = quantified.length / total;
  push({
    id: "quantified",
    label: "Resultados quantificados",
    status: bullets.length === 0 ? "fail" : quantRatio >= 0.5 ? "pass" : quantRatio >= 0.25 ? "warn" : "fail",
    detail: `${quantified.length}/${bullets.length} bullets de experiência têm números, % ou volume`,
    standard: "Impacto mensurável em pelo menos metade dos bullets",
    refs: quoteRefs(bullets.filter((b) => !isQuantified(b)), 6),
  });
  push({
    id: "first-person",
    label: "Sem primeira pessoa",
    status: cv.firstPersonHits === 0 ? "pass" : cv.firstPersonHits <= 2 ? "warn" : "fail",
    detail: `${cv.firstPersonHits} ocorrência(s) de "eu/meu/I/my"`,
    standard: "Tom impessoal e direto",
    refs: quoteRefs(
      raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^#/.test(l) && new RegExp(FIRST_PERSON_RE.source, "i").test(l))
        .map((l) => l.replace(/^[-*•]\s+/, "")),
      4,
    ),
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
      const deterministic = deterministicChecks(parsed, ctx.cv);

      const { object: qualitative } = await generateObject({
        model: skillModel(),
        schema: qualitativeSchema,
        prompt: `${doc.instructions}

Avalie QUALITATIVAMENTE o CV abaixo (as checagens determinísticas já cobrem contato, seções, tamanho, datas, verbos, quantificação e primeira pessoa — NÃO repita essas).
Produza de 3 a 6 checagens com id em kebab-case, sobre: ordem das seções, consistência de formato de datas/pontuação, clareza dos títulos de cargo, redundância/ruído, elementos que quebram ATS (tabelas, colunas, ícones), adequação de linguagem${focus ? `, com foco especial em: ${focus}` : ""}.
Em "evidence", copie os trechos do CV EXATAMENTE como estão (sem parafrasear) para a interface localizá-los.
Em "topFixes", as 3 correções de maior impacto, em português.

### CV
${ctx.cv}`,
      });

      const checks: FormatCheck[] = [
        ...deterministic,
        ...qualitative.checks.map(({ evidence, ...c }) => ({ ...c, refs: quoteRefs(evidence, 3) })),
      ];
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
