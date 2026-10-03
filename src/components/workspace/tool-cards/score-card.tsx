"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CvScore } from "@/agent/skills/cv_scorer";

type Output = CvScore & { band: string };

export function ScoreCard({ output }: { output: Output }) {
  const tone = output.overall >= 85 ? "text-success" : output.overall >= 70 ? "text-primary" : output.overall >= 50 ? "text-warning" : "text-destructive";
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className={`text-5xl font-semibold tabular-nums ${tone}`}>{output.overall}</div>
        <div className="pb-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">nota geral · {output.band}</div>
          <div className="text-sm">{output.verdict}</div>
        </div>
      </div>
      <ul className="space-y-2">
        {output.dimensions.map((d) => (
          <li key={d.name} className="text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {d.name} <span className="text-xs text-muted-foreground">({d.weight}%)</span>
              </span>
              <span className="tabular-nums">{d.score}</span>
            </div>
            <Progress value={d.score} className="mt-1 h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>
          </li>
        ))}
      </ul>
      {output.improvementPlan.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano de melhoria</div>
          <ol className="space-y-1.5 text-sm">
            {output.improvementPlan.map((p) => (
              <li key={p.priority} className="rounded-md bg-accent/60 p-2">
                <Badge variant="outline" className="mr-2">{p.section}</Badge>
                {p.action}
                {p.example && <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted-foreground">↳ {p.example}</pre>}
              </li>
            ))}
          </ol>
        </div>
      )}
      {output.missingKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {output.missingKeywords.map((k) => (
            <Badge key={k} variant="secondary">{k}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
