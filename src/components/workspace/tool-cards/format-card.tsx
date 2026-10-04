"use client";

import { CheckCircle2Icon, AlertTriangleIcon, XCircleIcon } from "lucide-react";
import type { FormatCheck } from "@/agent/skills/format_checker";
import type { CvHighlight } from "@/lib/cv/refs";
import { Highlightable } from "../highlightable";

type Output = {
  score: number;
  summary: { pass: number; warn: number; fail: number };
  stats: { words: number; pages: number; bullets: number; sections: string[] };
  checks: FormatCheck[];
  topFixes: string[];
};

const ICON = {
  pass: <CheckCircle2Icon className="size-4 text-success" />,
  warn: <AlertTriangleIcon className="size-4 text-warning" />,
  fail: <XCircleIcon className="size-4 text-destructive" />,
};
const TONE = { pass: "success", warn: "warning", fail: "destructive" } as const;
const ORDER = { fail: 0, warn: 1, pass: 2 } as const;

const checkHighlight = (c: FormatCheck): CvHighlight => ({ refs: c.refs ?? [], label: c.label, tone: TONE[c.status] });

/** O que destacar no CV assim que a tool termina: só as checagens com problema. */
export function formatHighlights(output: Output): CvHighlight[] {
  return output.checks.filter((c) => c.status !== "pass" && c.refs?.length).map(checkHighlight);
}

export function FormatCard({ output }: { output: Output }) {
  const ordered = [...output.checks].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-3xl font-semibold tabular-nums text-primary">{output.score}</span>
        <span className="text-muted-foreground">
          {output.summary.pass} ok · {output.summary.warn} atenção · {output.summary.fail} falhas
          <br />
          {output.stats.words} palavras · ~{output.stats.pages} pág. · {output.stats.bullets} bullets
        </span>
      </div>
      <ul className="divide-y rounded-md border">
        {ordered.map((c) => (
          <li key={c.id}>
            <Highlightable item={checkHighlight(c)} className="flex gap-2 p-2 pr-7 text-sm rounded-none first:rounded-t-md last:rounded-b-md">
              <span className="mt-0.5 shrink-0">{ICON[c.status]}</span>
              <div className="min-w-0">
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.detail}</div>
                <div className="text-[11px] text-primary/80">{c.standard}</div>
              </div>
            </Highlightable>
          </li>
        ))}
      </ul>
      {output.topFixes.length > 0 && (
        <div className="rounded-md bg-accent/60 p-2 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top correções</div>
          <ol className="list-decimal space-y-1 pl-4">
            {output.topFixes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
