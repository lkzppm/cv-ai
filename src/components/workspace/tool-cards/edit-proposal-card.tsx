"use client";

import { CheckIcon, GitCompareIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/lib/store/sessions";
import { useEditProposal } from "@/lib/store/edit-proposal";
import { countChanges, diffCv } from "@/lib/cv/diff";

type Output = {
  newCv: string;
  summary: string[];
  stats: { wordsBefore: number; wordsAfter: number; delta: number };
};

/**
 * Card do cv_editor. A revisão acontece no painel do CV (diff com aceitar/recusar
 * por bloco); aqui ficam o resumo e os atalhos para tudo de uma vez.
 */
export function EditProposalCard({ output, toolCallId }: { output: Output; toolCallId: string }) {
  const setCv = useSessions((s) => s.setCv);
  const currentCv = useSessions((s) => s.sessions.find((x) => x.id === s.activeId)?.cv ?? "");
  const pending = useEditProposal((s) => s.pending);
  const propose = useEditProposal((s) => s.propose);
  const dismiss = useEditProposal((s) => s.dismiss);

  const reviewing = pending?.toolCallId === toolCallId;
  const remaining = countChanges(diffCv(currentCv, reviewing ? pending.newCv : output.newCv));
  const applied = remaining === 0;

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
        {!applied && (
          <>
            {" · "}
            {remaining} {remaining === 1 ? "bloco" : "blocos"} {reviewing ? "em revisão no CV" : "a revisar"}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {applied ? (
          <Button size="sm" disabled>
            <CheckIcon /> Aplicado
          </Button>
        ) : reviewing ? (
          <>
            <Button
              size="sm"
              onClick={() => {
                setCv(pending.newCv, { label: "cv_editor" });
                dismiss();
              }}
            >
              <CheckIcon /> Aceitar tudo
            </Button>
            <Button size="sm" variant="outline" onClick={dismiss}>
              <XIcon /> Recusar tudo
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => propose({ toolCallId, newCv: output.newCv, summary: output.summary })}>
              <GitCompareIcon /> Revisar no CV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCv(output.newCv, { label: "cv_editor" })}>
              <CheckIcon /> Aplicar tudo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
