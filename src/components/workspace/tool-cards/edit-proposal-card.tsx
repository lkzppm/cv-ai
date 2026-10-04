"use client";

import { useState } from "react";
import { CheckIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/lib/store/sessions";
import type { CvHighlight, CvRef } from "@/lib/cv/refs";
import { CvMarkdown } from "../cv-markdown";
import { Highlightable } from "../highlightable";

type Output = {
  newCv: string;
  summary: string[];
  stats: { wordsBefore: number; wordsAfter: number; delta: number };
  /** Trechos do CV atual que a proposta altera (calculado na tool). */
  changed?: CvRef[];
};

const changedHighlight = (output: Output): CvHighlight => ({
  refs: output.changed ?? [],
  label: "vai mudar",
  tone: "warning",
});

/** Ao terminar, marca no CV atual o que a proposta vai alterar. */
export function editHighlights(output: Output): CvHighlight[] {
  const h = changedHighlight(output);
  return h.refs.length ? [h] : [];
}

export function EditProposalCard({ output }: { output: Output }) {
  const setCv = useSessions((s) => s.setCv);
  const currentCv = useSessions((s) => s.sessions.find((x) => x.id === s.activeId)?.cv);
  const [preview, setPreview] = useState(false);
  const applied = currentCv === output.newCv;
  const item = changedHighlight(output);

  return (
    <div className="space-y-3">
      <Highlightable item={applied ? { ...item, refs: [] } : item} className="-mx-1.5 px-1.5 py-1 pr-6">
        <ul className="list-disc space-y-0.5 pl-4 text-sm">
          {output.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {!applied && item.refs.length > 0 && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            {item.refs.length} trecho(s) do CV atual serão alterados
          </div>
        )}
      </Highlightable>
      <div className="text-xs text-muted-foreground">
        {output.stats.wordsBefore} → {output.stats.wordsAfter} palavras ({output.stats.delta >= 0 ? "+" : ""}
        {output.stats.delta})
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setCv(output.newCv)} disabled={applied}>
          <CheckIcon /> {applied ? "Aplicado" : "Aplicar no CV"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPreview((v) => !v)}>
          <EyeIcon /> {preview ? "Ocultar" : "Pré-visualizar"}
        </Button>
      </div>
      {preview && (
        <div className="max-h-96 overflow-auto rounded-md border bg-card p-4">
          <CvMarkdown markdown={output.newCv} />
        </div>
      )}
    </div>
  );
}
