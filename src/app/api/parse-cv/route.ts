import { generateText } from "ai";
import { skillModel } from "@/agent/models";
import { extractPdfText } from "@/lib/cv/pdf-text";

export const maxDuration = 60;

/**
 * Recebe um PDF/TXT/MD (multipart "file") e devolve o texto.
 * Com `format=1`, converte o texto bruto em Markdown limpo usando o modelo.
 *
 * Lições do PDF do Canva (2026-10-04): a unpdf devolvia o texto na ordem do
 * content stream (títulos agrupados, bullets soltos) → `extractPdfText` ordena
 * por posição; e o gpt-oss-20b estourava o limite de saída da Groq só com
 * raciocínio (finishReason "length", texto vazio) → 120b, `reasoningEffort: low`
 * e `maxOutputTokens` explícito. Se mesmo assim vier vazio, o cliente usa o
 * texto bruto.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const format = form.get("format") === "1";
  if (!(file instanceof File)) return Response.json({ error: "Arquivo ausente" }, { status: 400 });

  let text = "";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    text = await extractPdfText(new Uint8Array(await file.arrayBuffer()));
  } else {
    text = await file.text();
  }
  text = text.replace(/\u0000/g, "").trim();
  if (!text) return Response.json({ error: "Não foi possível extrair texto (PDF escaneado?)" }, { status: 422 });

  if (format && process.env.GROQ_API_KEY) {
    const { text: md, finishReason } = await generateText({
      model: skillModel(),
      temperature: 0,
      maxOutputTokens: 8000,
      providerOptions: { groq: { reasoningEffort: "low" } },
      prompt: `Converta o currículo abaixo (texto extraído de PDF, já na ordem de leitura) para Markdown limpo, preservando TODO o conteúdo e a ordem.
Formato: "# Nome" na primeira linha; linha de contato; "## Seção" para cada título de seção (Skills, Experiência, Educação, Certificações, Projetos…); "### Cargo · Empresa · Local"; datas em itálico; bullets com "-".
" | " na mesma linha separa colunas lado a lado: trate cada lado como um item próprio.
Não adicione, resuma ou corrija nada. Responda só com o Markdown.

${text.slice(0, 20000)}`,
    });
    const markdown = md.replace(/^```(?:markdown|md)?\n?|```$/g, "").trim();
    return Response.json({ text, markdown: finishReason === "stop" && markdown ? markdown : null });
  }
  return Response.json({ text });
}
