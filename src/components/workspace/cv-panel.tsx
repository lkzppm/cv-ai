"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DownloadIcon, PencilIcon, PrinterIcon, UploadIcon, Undo2Icon, Loader2Icon, CheckIcon, XIcon, ScanSearchIcon, GitCompareIcon, MessageSquareTextIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveSession, useSessions } from "@/lib/store/sessions";
import { useHighlights } from "@/lib/store/highlights";
import { useEditProposal } from "@/lib/store/edit-proposal";
import { useMobileChat } from "@/lib/store/mobile-chat";
import { CvMarkdown } from "./cv-markdown";
import { CvHighlightLayer } from "./cv-highlights";
import { CvDiff, CvDiffView } from "./cv-diff-view";
import { VersionBar, VersionMenu } from "./cv-versions";
import { countChanges, diffCv } from "@/lib/cv/diff";
import { parseCv } from "@/lib/cv/parse";
import { CV_FILE_ACCEPT, parseCvFile } from "@/lib/cv/upload";
import { cn } from "@/lib/utils";

/** Painel principal: o CV atual como folha flutuante, com toolbar em pílula. */
export function CvPanel() {
  // Pode ficar nulo por um instante: a última sessão excluída enquanto o painel
  // ainda anima a saída (AnimatePresence). Todos os hooks vêm antes do guard.
  const session = useActiveSession();
  const setCv = useSessions((s) => s.setCv);
  const undoCv = useSessions((s) => s.undoCv);
  const restoreCv = useSessions((s) => s.restoreCv);
  // Histórico navegável: índice da versão aberta (null = atual) e diff com a atual.
  // Derivado no render: se o histórico encolher (Desfazer), volta para a atual sem efeito.
  const [viewingRaw, setViewing] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const historyLength = session?.cvHistory.length ?? 0;
  const viewing = viewingRaw !== null && viewingRaw < historyLength ? viewingRaw : null;
  // CV vazio (sessão "Colar o texto") já abre no editor.
  const [mode, setMode] = useState<"view" | "edit">(session?.cv.trim() ? "view" : "edit");
  const [draft, setDraft] = useState(session?.cv ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pinned = useHighlights((s) => s.pinned);
  const clearHighlights = useHighlights((s) => s.clear);
  const pending = useEditProposal((s) => s.pending);
  const dismissProposal = useEditProposal((s) => s.dismiss);
  const showChat = useMobileChat((s) => s.show);
  const chatBusy = useMobileChat((s) => s.busy);

  if (!session) return null;
  const pendingChanges = pending ? countChanges(diffCv(session.cv, pending.newCv)) : 0;

  const stats = parseCv(session.cv);
  const version = session.cvHistory.length + 1;

  const startEdit = () => {
    setDraft(session.cv);
    setMode("edit");
  };
  const saveEdit = () => {
    setCv(draft, { label: "edição manual" });
    setMode("view");
  };
  const openVersion = (index: number | null) => {
    setViewing(index);
    if (index === null) setShowDiff(false);
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      setCv(await parseCvFile(file), { label: "upload" });
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
    <div className="relative mx-auto flex max-w-[760px] flex-col pb-28">
      {/* cabeçalho discreto */}
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1 text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-[0.18em]">CV atual</span>
        <span className="opacity-60">·</span>
        <span>{stats.wordCount} palavras</span>
        <span className="opacity-60">·</span>
        <span>~{stats.estimatedPages} pág.</span>
        <AnimatePresence>
          {pending && mode === "view" && (
            <motion.span
              key="edit-bar"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 rounded-full border border-dashed border-warning/60 bg-warning/[0.08] py-0.5 pr-0.5 pl-2 text-warning max-sm:order-last sm:ml-2"
            >
              <GitCompareIcon className="size-3" />
              <span>
                revisão do cv_editor · {pendingChanges} {pendingChanges === 1 ? "bloco" : "blocos"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCv(pending.newCv);
                  dismissProposal();
                }}
                className="ml-1 rounded-full bg-success/15 px-2 py-0.5 font-medium text-success transition-colors hover:bg-success/25"
              >
                aceitar tudo
              </button>
              <button
                type="button"
                onClick={dismissProposal}
                className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                recusar tudo
              </button>
            </motion.span>
          )}
          {pinned && !pending && mode === "view" && (
            <motion.button
              key="hl-chip"
              type="button"
              onClick={clearHighlights}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              title="Limpar destaques"
              className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary/[0.06] px-2 py-0.5 text-primary transition-colors hover:bg-primary/[0.12] max-sm:order-last sm:ml-2"
            >
              <ScanSearchIcon className="size-3" />
              {pinned.items.length} {pinned.items.length === 1 ? "destaque" : "destaques"} · {pinned.source}
              <XIcon className="size-3 opacity-70" />
            </motion.button>
          )}
        </AnimatePresence>
        <VersionMenu versions={session.cvHistory} current={version} viewing={viewing} onSelect={openVersion} />
      </div>

      <AnimatePresence>
        {viewing !== null && mode === "view" && (
          <VersionBar
            key="version-bar"
            versions={session.cvHistory}
            current={version}
            viewing={viewing}
            showDiff={showDiff}
            onNavigate={openVersion}
            onToggleDiff={() => setShowDiff((v) => !v)}
            onRestore={() => {
              restoreCv(viewing);
              openVersion(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* folha */}
      <motion.div
        layout
        className={cn(
          "print-area gradient-border relative rounded-2xl bg-card p-5 sm:rounded-3xl sm:p-8 md:p-12",
          "shadow-[0_24px_60px_-28px_rgba(0,0,0,.5),0_0_0_1px_var(--glass-border)]",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mode === "view" ? (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {pending ? (
                <CvDiffView current={session.cv} pending={pending} />
              ) : viewing !== null && session.cvHistory[viewing] ? (
                showDiff ? (
                  <CvDiff
                    before={session.cvHistory[viewing].cv}
                    after={session.cv}
                    tone="primary"
                    emptyNote={`v${viewing + 1} é idêntica à versão atual.`}
                  />
                ) : (
                  <CvMarkdown markdown={session.cvHistory[viewing].cv} />
                )
              ) : session.cv.trim() ? (
                <CvHighlightLayer markdown={session.cv}>
                  <CvMarkdown markdown={session.cv} />
                </CvHighlightLayer>
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
                className="min-h-[70vh] resize-y border-0 bg-transparent p-0 font-mono text-base leading-relaxed shadow-none focus-visible:ring-0 lg:text-[13px]"
                placeholder="# Seu Nome&#10;&#10;cidade · email · telefone · linkedin&#10;&#10;## Experiência&#10;..."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* toolbar flutuante; abaixo de lg ganha ao lado o botão que abre o chat do agente */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex items-center justify-center gap-2 px-3 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:px-0"
      >
        <TooltipProvider delayDuration={200}>
        <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)]">
          <input
            ref={fileRef}
            type="file"
            accept={CV_FILE_ACCEPT}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          {viewing !== null && mode === "view" ? (
            <>
              <ToolbarButton label="Voltar à versão atual" onClick={() => openVersion(null)}>
                <XIcon className="size-4" />
              </ToolbarButton>
              <ToolbarButton label={showDiff ? "Ocultar diff" : "Diff com a versão atual"} onClick={() => setShowDiff((v) => !v)}>
                <GitCompareIcon className="size-4" />
              </ToolbarButton>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  restoreCv(viewing);
                  openVersion(null);
                }}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <CheckIcon className="size-4" /> Restaurar v{viewing + 1}
              </motion.button>
            </>
          ) : mode === "view" ? (
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
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <CheckIcon className="size-4" /> Salvar
              </motion.button>
            </>
          )}
        </div>
        </TooltipProvider>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={showChat}
          aria-label="Abrir o chat com o agente"
          className="pointer-events-auto relative grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] lg:hidden"
        >
          <MessageSquareTextIcon className="size-5" />
          {chatBusy && <span aria-hidden className="pulse-dot absolute top-0 right-0 size-3 rounded-full border-2 border-background bg-success" />}
        </motion.button>
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
