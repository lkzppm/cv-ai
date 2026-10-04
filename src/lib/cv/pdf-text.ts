import { getDocumentProxy } from "unpdf";

/**
 * Extrai o texto de um PDF respeitando o layout visual.
 *
 * `extractText` da unpdf devolve os itens na ordem do content stream, que em
 * PDFs de editores gráficos (Canva, Figma, InDesign) não é a ordem de leitura:
 * títulos de seção vêm agrupados, bullets fora do cargo etc. Aqui os itens são
 * agrupados em linhas pela coordenada y e ordenados de cima para baixo e da
 * esquerda para a direita, como o `pdftotext -layout`.
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(data);
  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items
      // `TextMarkedContent` não tem `str`; o cast evita depender dos tipos internos do pdfjs.
      .filter((it) => "str" in it && typeof it.str === "string" && it.str.trim().length > 0)
      .map((raw) => {
        const it = raw as unknown as TextItem;
        return {
          str: it.str,
          x: it.transform[4],
          y: it.transform[5],
          size: Math.abs(it.transform[3]) || Math.abs(it.transform[0]) || it.height || 10,
          width: it.width,
        };
      });

    // Agrupa em linhas: mesma linha se |Δy| for menor que metade do tamanho da fonte.
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: (typeof items)[] = [];
    for (const it of items) {
      const line = lines[lines.length - 1];
      if (line && Math.abs(line[0].y - it.y) <= Math.max(2, line[0].size * 0.5)) line.push(it);
      else lines.push([it]);
    }

    const out: string[] = [];
    let prevY: number | null = null;
    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      // Parágrafo novo quando o salto vertical é bem maior que uma linha.
      if (prevY !== null && prevY - line[0].y > line[0].size * 1.9) out.push("");
      prevY = line[0].y;
      let text = "";
      let cursor = 0;
      for (const it of line) {
        if (text) {
          const gap = it.x - cursor;
          // Lacuna grande = colunas diferentes na mesma altura; separa com " | ".
          text += gap > it.size * 2.5 ? " | " : gap > it.size * 0.15 ? " " : "";
        }
        text += it.str;
        cursor = it.x + it.width;
      }
      out.push(text.replace(/\s+/g, " ").trim());
    }
    pages.push(out.join("\n"));
  }
  return pages.join("\n\n").replace(/\u0000/g, "").trim();
}

type TextItem = { str: string; transform: number[]; width: number; height: number };
