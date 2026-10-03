"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DownloadIcon, PencilIcon, PrinterIcon, UploadIcon, Undo2Icon, Loader2Icon, CheckIcon, XIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveSession, useSessions } from "@/lib/store/sessions";
import { CvMarkdown } from "./cv-markdown";
import { parseCv } from "@/lib/cv/parse";
import { cn } from "@/lib/utils";

/** Painel principal: o CV atual como folha flutuante, com toolbar em pílula. */
export function CvPanel() {
  const session = useActiveSession()!;
  const setCv = useSessions((s) => s.setCv);
  const undoCv = useSessions((s) => s.undoCv);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(session.cv);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = parseCv(session.cv);
  const version = session.cvHistory.length + 1;

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
    <div className="relative mx-auto flex max-w-[760px] flex-col pb-24 pt-2">
      {/* cabeçalho discreto */}
      <div className="mb-3 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.18em]">CV atual</span>
        <span className="opacity-60">·</span>
        <span>{stats.wordCount} palavras</span>
        <span className="opacity-60">·</span>
        <span>~{stats.estimatedPages} pág.</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={version}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="ml-auto rounded-full border border-primary/30 bg-accent px-2 py-0.5 font-medium text-accent-foreground"
          >
            v{version}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* folha */}
      <motion.div
        layout
        className={cn(
          "print-area gradient-border relative rounded-3xl bg-card p-8 md:p-12",
          "shadow-[0_30px_80px_-30px_rgba(0,0,0,.6),0_0_0_1px_var(--glass-border)]",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mode === "view" ? (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {session.cv.trim() ? (
                <CvMarkdown markdown={session.cv} />
              ) : (
                <div className="py-24 text-center text-muted-foreground">
                  Cole seu currículo em <b>Editar</b> ou envie um PDF para começar.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[70vh] resize-y border-0 bg-transparent p-0 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
                placeholder="# Seu Nome&#10;&#10;cidade · email · telefone · linkedin&#10;&#10;## Experiência&#10;..."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* toolbar flutuante */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2"
      >
        <TooltipProvider delayDuration={200}>
        <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)]">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.md,.txt,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          {mode === "view" ? (
            <>
              <ToolbarButton label="Enviar PDF ou texto" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
              </ToolbarButton>
              <ToolbarButton label="Editar Markdown" onClick={startEdit}>
                <PencilIcon className="size-4" />
              </ToolbarButton>
              <ToolbarButton label="Desfazer última alteração" onClick={undoCv} disabled={session.cvHistory.length === 0}>
                <Undo2Icon className="size-4" />
              </ToolbarButton>
              <span className="mx-1 h-5 w-px bg-glass-border" />
              <ToolbarButton label="Baixar .md" onClick={download}>
                <DownloadIcon className="size-4" />
              </ToolbarButton>
              <ToolbarButton label="Imprimir / salvar PDF" onClick={() => window.print()}>
                <PrinterIcon className="size-4" />
              </ToolbarButton>
            </>
          ) : (
            <>
              <ToolbarButton label="Cancelar" onClick={() => setMode("view")}>
                <XIcon className="size-4" />
              </ToolbarButton>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveEdit}
                className="flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--iris),var(--magenta))] px-4 py-2 text-sm font-medium text-white"
              >
                <CheckIcon className="size-4" /> Salvar
              </motion.button>
            </>
          )}
        </div>
        </TooltipProvider>
      </motion.div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
