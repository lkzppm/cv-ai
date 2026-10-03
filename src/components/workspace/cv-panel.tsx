"use client";

import { useRef, useState } from "react";
import { DownloadIcon, PencilIcon, EyeIcon, PrinterIcon, UploadIcon, Undo2Icon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useActiveSession, useSessions } from "@/lib/store/sessions";
import { CvMarkdown } from "./cv-markdown";
import { parseCv } from "@/lib/cv/parse";

/** Painel principal: o CV atual, com modo leitura/edição, upload e exportação. */
export function CvPanel() {
  const session = useActiveSession()!;
  const setCv = useSessions((s) => s.setCv);
  const undoCv = useSessions((s) => s.undoCv);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(session.cv);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = parseCv(session.cv);

  const startEdit = () => {
    setDraft(session.cv);
    setMode("edit");
  };
  const saveEdit = () => {
    setCv(draft);
    setMode("view");
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("format", "1");
      const res = await fetch("/api/parse-cv", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao ler arquivo");
      setCv(data.markdown ?? data.text);
      setMode("view");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const download = () => {
    const blob = new Blob([session.cv], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(stats.name ?? "curriculo").replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">CV atual</h2>
        <Badge variant="secondary">{stats.wordCount} palavras</Badge>
        <Badge variant="secondary">~{stats.estimatedPages} pág.</Badge>
        {session.cvHistory.length > 0 && <Badge variant="outline">v{session.cvHistory.length + 1}</Badge>}
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.md,.txt,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2Icon className="animate-spin" /> : <UploadIcon />} PDF / texto
          </Button>
          {session.cvHistory.length > 0 && (
            <Button size="sm" variant="outline" onClick={undoCv} title="Desfazer última alteração">
              <Undo2Icon /> Desfazer
            </Button>
          )}
          {mode === "view" ? (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <PencilIcon /> Editar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
                <EyeIcon /> Cancelar
              </Button>
              <Button size="sm" onClick={saveEdit}>
                Salvar
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={download} title="Baixar .md">
            <DownloadIcon />
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} title="Imprimir / salvar PDF">
            <PrinterIcon />
          </Button>
        </div>
      </div>

      <div className="print-area rounded-2xl border bg-card p-8 shadow-sm md:p-10">
        {mode === "view" ? (
          session.cv.trim() ? (
            <CvMarkdown markdown={session.cv} />
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              Cole seu currículo em <b>Editar</b> ou envie um PDF para começar.
            </div>
          )
        ) : (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[70vh] resize-y font-mono text-[13px] leading-relaxed"
            placeholder="# Seu Nome&#10;&#10;cidade · email · telefone · linkedin&#10;&#10;## Experiência&#10;..."
          />
        )}
      </div>
    </div>
  );
}
