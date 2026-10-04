"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CvScore } from "@/agent/skills/cv_scorer";
import { quoteRef, quoteRefs, sectionRef, type CvHighlight } from "@/lib/cv/refs";
import { Highlightable } from "../highlightable";

type Output = CvScore & { band: string };

const toneFor = (score: number): CvHighlight["tone"] => (score >= 70 ? "primary" : score >= 50 ? "warning" : "destructive");

const dimensionHighlight = (d: Output["dimensions"][number]): CvHighlight => ({
  refs: quoteRefs(d.evidence, 2),
  label: d.name,
  tone: toneFor(d.score),
});

/** Item do plano: o trecho exato quando o modelo o citou; senão a seção inteira. */
const planHighlight = (p: Output["improvementPlan"][number]): CvHighlight => ({
  refs: p.quote?.trim() ? [quoteRef(p.quote)] : p.section ? [sectionRef(p.section)] : [],
  label: `${p.priority}. ${p.section}`,
  tone: "primary",
});

/** Ao terminar, destaca o plano de melhoria (as partes que o agente quer mexer). */
export function scoreHighlights(output: Output): CvHighlight[] {
  return output.improvementPlan.map(planHighlight).filter((h) => h.refs.length);
}

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
      <ul className="space-y-1">
        {output.dimensions.map((d) => (
          <li key={d.name} className="text-sm">
            <Highlightable item={dimensionHighlight(d)} className="-mx-1.5 px-1.5 py-1 pr-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {d.name} <span className="text-xs text-muted-foreground">({d.weight}%)</span>
                </span>
                <span className="tabular-nums">{d.score}</span>
              </div>
              <Progress value={d.score} className="mt-1 h-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>
            </Highlightable>
          </li>
        ))}
      </ul>
      {output.improvementPlan.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano de melhoria</div>
          <ol className="space-y-1.5 text-sm">
            {output.improvementPlan.map((p) => (
              <li key={p.priority}>
                <Highlightable item={planHighlight(p)} className="bg-accent/60 p-2 pr-7">
                  <Badge variant="outline" className="mr-2">{p.section}</Badge>
                  {p.action}
                  {p.example && <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted-foreground">↳ {p.example}</pre>}
                </Highlightable>
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
