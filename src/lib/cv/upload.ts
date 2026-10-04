"use client";

/**
 * Envia um PDF/Markdown/texto para `/api/parse-cv` e devolve o Markdown.
 * Usado pela toolbar do painel e pela homepage (sem sessão).
 */
export async function parseCvFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("format", "1");
  const res = await fetch("/api/parse-cv", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao ler arquivo");
  // `markdown` vem null quando a conversão falha; o texto bruto ainda é útil.
  return data.markdown || data.text || "";
}

export const CV_FILE_ACCEPT = ".pdf,.md,.txt,text/plain,text/markdown,application/pdf";

/** Título de sessão a partir do nome do arquivo ("ana-souza.pdf" → "ana-souza"). */
export const titleFromFile = (file: File) => file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Meu currículo";
