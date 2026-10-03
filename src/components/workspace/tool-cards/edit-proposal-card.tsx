"use client";

import { useState } from "react";
import { CheckIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/lib/store/sessions";
import { CvMarkdown } from "../cv-markdown";

type Output = {
  newCv: string;
  summary: string[];
  stats: { wordsBefore: number; wordsAfter: number; delta: number };
};

export function EditProposalCard({ output }: { output: Output }) {
  const setCv = useSessions((s) => s.setCv);
  const currentCv = useSessions((s) => s.sessions.find((x) => x.id === s.activeId)?.cv);
  const [preview, setPreview] = useState(false);
  const applied = currentCv === output.newCv;

  return (
    <div className="space-y-3">
      <ul className="list-disc space-y-0.5 pl-4 text-sm">
        {output.summary.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
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
