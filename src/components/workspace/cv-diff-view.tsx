"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { CheckIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { acceptHunk, countChanges, diffCv, rejectHunk } from "@/lib/cv/diff";
import { useEditProposal, type EditProposal } from "@/lib/store/edit-proposal";
import { useSessions } from "@/lib/store/sessions";
import { CvMarkdown } from "./cv-markdown";
import { revealInChat } from "@/lib/reveal";

type CvDiffProps = {
  /** Texto de referência (o "antes"). */
  before: string;
  /** Texto comparado (o "depois"). */
  after: string;
  /** Cor dos blocos: âmbar para proposta em revisão, azul para comparação de versões. */
  tone?: "warning" | "primary";
  /** Com handlers, cada bloco ganha Aceitar/Recusar; sem eles o diff é só leitura. */
  onAccept?: (index: number) => void;
  onReject?: (index: number) => void;
  onReveal?: () => void;
  /** Mensagem quando não há diferenças. */
  emptyNote?: string;
};

/**
 * Diff por blocos do CV, renderizado como documento: trechos iguais em Markdown
 * normal, blocos alterados com antes (vermelho, riscado) e depois (verde).
 * Usado pela revisão do cv_editor (com aceitar/recusar) e pelo histórico de
 * versões (somente leitura).
 */
export function CvDiff({ before, after, tone = "warning", onAccept, onReject, onReveal, emptyNote }: CvDiffProps) {
  const segments = useMemo(() => diffCv(before, after), [before, after]);
  const total = countChanges(segments);
  const firstRef = useRef<HTMLDivElement>(null);

  // Ao abrir, leva o primeiro bloco para o centro.
  useEffect(() => {
    firstRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [before]);

  if (total === 0) {
    return (
      <div className="cv-diff">
        {emptyNote && <p className="mb-4 rounded-xl border border-dashed border-primary/40 bg-primary/[0.05] px-3 py-2 text-center text-xs text-primary">{emptyNote}</p>}
        <CvMarkdown markdown={after} />
      </div>
    );
  }

  const interactive = Boolean(onAccept && onReject);

  return (
    <div className="cv-diff">
      {segments.map((s, i) => {
        if (s.type === "equal") {
          const text = s.lines.join("\n");
          return text.trim() ? <CvMarkdown key={`eq-${i}`} markdown={text} /> : null;
        }
        return (
          <motion.div
            key={`ch-${i}`}
            ref={s.index === 0 ? firstRef : undefined}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="cv-hunk"
            data-tone={tone}
          >
            <div className="cv-hunk-bar">
              {onReveal ? (
                <button type="button" className="cv-hunk-title" onClick={onReveal} title="Ver no chat">
                  alteração {s.index + 1}/{total}
                </button>
              ) : (
                <span className="cv-hunk-title">
                  alteração {s.index + 1}/{total}
                </span>
              )}
              <span className="flex-1" />
              {interactive && (
                <>
                  <button type="button" className="cv-hunk-btn cv-hunk-btn-reject" onClick={() => onReject?.(s.index)}>
                    <XIcon className="size-3" /> Recusar
                  </button>
                  <button type="button" className="cv-hunk-btn cv-hunk-btn-accept" onClick={() => onAccept?.(s.index)}>
                    <CheckIcon className="size-3" /> Aceitar
                  </button>
                </>
              )}
            </div>
            {s.oldLines.some((l) => l.trim()) && (
              <div className="cv-hunk-old">
                <MinusIcon className="cv-hunk-sign" />
                <CvMarkdown markdown={s.oldLines.join("\n")} />
              </div>
            )}
            {s.newLines.some((l) => l.trim()) && (
              <div className="cv-hunk-new">
                <PlusIcon className="cv-hunk-sign" />
                <CvMarkdown markdown={s.newLines.join("\n")} />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Revisão da proposta do cv_editor: aceitar um bloco aplica só ele (com
 * Desfazer); recusar tira o bloco da proposta. Sem blocos restantes, fecha.
 */
export function CvDiffView({ current, pending }: { current: string; pending: EditProposal }) {
  const setCv = useSessions((s) => s.setCv);
  const updateProposal = useEditProposal((s) => s.updateProposal);
  const dismiss = useEditProposal((s) => s.dismiss);
  const segments = useMemo(() => diffCv(current, pending.newCv), [current, pending.newCv]);
  const total = countChanges(segments);

  useEffect(() => {
    if (total === 0) dismiss();
  }, [total, dismiss]);

  return (
    <CvDiff
      before={current}
      after={pending.newCv}
      tone="warning"
      onAccept={(i) => setCv(acceptHunk(segments, i), { label: "cv_editor" })}
      onReject={(i) => updateProposal(rejectHunk(segments, i))}
      onReveal={() => revealInChat(undefined, pending.toolCallId)}
    />
  );
}
