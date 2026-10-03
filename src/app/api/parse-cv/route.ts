import { generateText } from "ai";
import { extractText, getDocumentProxy } from "unpdf";
import { agentModel } from "@/agent/models";

export const maxDuration = 60;

/**
 * Recebe um PDF/TXT/MD (multipart "file") e devolve o texto.
 * Com `format=1`, converte o texto bruto em Markdown limpo usando o modelo.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const format = form.get("format") === "1";
  if (!(file instanceof File)) return Response.json({ error: "Arquivo ausente" }, { status: 400 });

  let text = "";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const res = await extractText(pdf, { mergePages: true });
    text = res.text;
  } else {
    text = await file.text();
  }
  text = text.replace(/\u0000/g, "").trim();
  if (!text) return Response.json({ error: "Não foi possível extrair texto (PDF escaneado?)" }, { status: 422 });

  if (format && process.env.GROQ_API_KEY) {
    const { text: md } = await generateText({
      model: agentModel(),
      temperature: 0,
      prompt: `Converta o currículo abaixo (texto extraído de PDF) para Markdown limpo, preservando TODO o conteúdo e a ordem.
Formato: "# Nome" na primeira linha; linha de contato; "## Seção"; "### Cargo · Empresa · Local"; datas em itálico; bullets com "-".
Não adicione, resuma ou corrija nada. Responda só com o Markdown.

${text.slice(0, 20000)}`,
    });
    return Response.json({ text, markdown: md.replace(/^```(?:markdown|md)?\n?|```$/g, "").trim() });
  }
  return Response.json({ text });
}
