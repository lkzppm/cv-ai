"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { CheckIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { acceptHunk, countChanges, diffCv, rejectHunk } from "@/lib/cv/diff";
import { useEditProposal, type EditProposal } from "@/lib/store/edit-proposal";
import { useSessions } from "@/lib/store/sessions";
import { CvMarkdown } from "./cv-markdown";
import { revealInChat } from "@/lib/reveal";

/**
 * Revisão da proposta do cv_editor dentro do painel: o CV atual com cada
 * bloco alterado mostrado como antes (vermelho) / depois (verde) e botões
 * para aceitar ou recusar aquele bloco. Aceitar aplica na hora (com Desfazer);
 * recusar tira o bloco da proposta. Sem blocos restantes, a revisão fecha.
 */
export function CvDiffView({ current, pending }: { current: string; pending: EditProposal }) {
  const setCv = useSessions((s) => s.setCv);
  const updateProposal = useEditProposal((s) => s.updateProposal);
  const dismiss = useEditProposal((s) => s.dismiss);
  const segments = useMemo(() => diffCv(current, pending.newCv), [current, pending.newCv]);
  const total = countChanges(segments);
  const firstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (total === 0) dismiss();
  }, [total, dismiss]);

  // Ao abrir a revisão, leva o primeiro bloco para o centro.
  useEffect(() => {
    firstRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [pending.toolCallId]);

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
          >
            <div className="cv-hunk-bar">
              <button type="button" className="cv-hunk-title" onClick={() => revealInChat(undefined, pending.toolCallId)} title="Ver no chat">
                alteração {s.index + 1}/{total}
              </button>
              <span className="flex-1" />
              <button
                type="button"
                className="cv-hunk-btn cv-hunk-btn-reject"
                onClick={() => updateProposal(rejectHunk(segments, s.index))}
              >
                <XIcon className="size-3" /> Recusar
              </button>
              <button type="button" className="cv-hunk-btn cv-hunk-btn-accept" onClick={() => setCv(acceptHunk(segments, s.index))}>
                <CheckIcon className="size-3" /> Aceitar
              </button>
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
