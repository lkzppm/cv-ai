/**
 * Diff por linhas entre o CV atual e a proposta do cv_editor.
 * LCS por programação dinâmica: CVs têm poucas centenas de linhas, sobra folga.
 *
 * `diffCv` devolve segmentos iguais e "hunks" (blocos alterados). A revisão no
 * painel aceita/recusa hunk a hunk: aceitar aplica só aquele bloco ao CV atual;
 * recusar remove o bloco da proposta. Nos dois casos o diff é recalculado.
 */
export type DiffSegment =
  | { type: "equal"; lines: string[] }
  | { type: "change"; index: number; oldLines: string[]; newLines: string[] };

const key = (l: string) => l.trimEnd();

export function diffCv(oldText: string, newText: string): DiffSegment[] {
  const a = oldText.replace(/\r/g, "").split("\n");
  const b = newText.replace(/\r/g, "").split("\n");
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = tamanho da LCS de a[i..] e b[j..]
  const lcs: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = key(a[i]) === key(b[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  let eq: string[] = [];
  let del: string[] = [];
  let ins: string[] = [];
  const flushChange = () => {
    if (del.length || ins.length) {
      // Só espaço em branco mudou: trata como igual (fica a versão nova).
      const same = del.map((l) => l.trim()).filter(Boolean).join("\n") === ins.map((l) => l.trim()).filter(Boolean).join("\n");
      if (same) eq.push(...ins);
      else {
        flushEqual();
        segments.push({ type: "change", index: 0, oldLines: del, newLines: ins });
      }
      del = [];
      ins = [];
    }
  };
  const flushEqual = () => {
    if (eq.length) segments.push({ type: "equal", lines: eq });
    eq = [];
  };

  while (i < n || j < m) {
    if (i < n && j < m && key(a[i]) === key(b[j])) {
      flushChange();
      eq.push(b[j]);
      i++;
      j++;
    } else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      ins.push(b[j]);
      j++;
    } else {
      del.push(a[i]);
      i++;
    }
  }
  flushChange();
  flushEqual();

  // Blocos alterados separados só por linhas em branco viram um bloco só
  // (ex.: título removido + bullets removidos logo abaixo).
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    const prev2 = merged[merged.length - 2];
    if (
      seg.type === "change" &&
      prev?.type === "equal" &&
      prev.lines.every((l) => !l.trim()) &&
      prev2?.type === "change"
    ) {
      merged.splice(-1, 1);
      prev2.oldLines.push(...prev.lines, ...seg.oldLines);
      prev2.newLines.push(...prev.lines, ...seg.newLines);
      continue;
    }
    merged.push(seg);
  }

  let k = 0;
  for (const s of merged) if (s.type === "change") s.index = k++;
  return merged;
}

export const countChanges = (segments: DiffSegment[]) => segments.filter((s) => s.type === "change").length;

/** CV atual com apenas o hunk `index` aplicado. */
export function acceptHunk(segments: DiffSegment[], index: number): string {
  return segments
    .flatMap((s) => (s.type === "equal" ? s.lines : s.index === index ? s.newLines : s.oldLines))
    .join("\n");
}

/** Proposta sem o hunk `index` (volta ao texto atual naquele trecho). */
export function rejectHunk(segments: DiffSegment[], index: number): string {
  return segments
    .flatMap((s) => (s.type === "equal" ? s.lines : s.index === index ? s.oldLines : s.newLines))
    .join("\n");
}
