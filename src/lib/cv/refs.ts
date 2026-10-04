/**
 * Referências a trechos do CV ("âncoras") que as tools devolvem para a UI
 * destacar no painel ao lado. São puras (sem DOM) e serializáveis: viajam
 * dentro do `output` de cada tool e ficam persistidas com a conversa.
 *
 * - `quote`:   trecho VERBATIM do CV (bullet, linha de cargo, frase do resumo).
 * - `section`: uma seção inteira pelo título do `##` (ou pelo tipo normalizado).
 * - `header`:  nome (`#`) + linha de contato logo abaixo.
 */
export type CvRef =
  | { kind: "quote"; text: string }
  | { kind: "section"; title: string }
  | { kind: "header" };

export type CvHighlightTone = "primary" | "warning" | "destructive" | "success";

/** Um grupo de referências com rótulo e cor, como o card as apresenta. */
export type CvHighlight = {
  refs: CvRef[];
  label?: string;
  tone?: CvHighlightTone;
};

export const quoteRef = (text: string): CvRef => ({ kind: "quote", text });
export const sectionRef = (title: string): CvRef => ({ kind: "section", title });
export const headerRef = (): CvRef => ({ kind: "header" });

/** Converte uma lista de trechos (vinda do modelo) em refs, ignorando vazios/curtos. */
export function quoteRefs(quotes: readonly (string | null | undefined)[] | null | undefined, max = 6): CvRef[] {
  const out: CvRef[] = [];
  for (const q of quotes ?? []) {
    const t = (q ?? "").trim();
    if (t.length < 4) continue;
    if (out.some((r) => r.kind === "quote" && r.text === t)) continue;
    out.push(quoteRef(t));
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Normalização usada tanto para casar trechos com o DOM quanto para
 * comparar linhas: minúsculas, sem marcação Markdown, espaços colapsados.
 */
export function normalizeCvText(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/^[\s>#*\-•·]+/, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[“”"']/g, "")
    .replace(/[.,;:!?…]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
