"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { RoleMatchResult } from "@/agent/skills/role_matcher";

type Output =
  | ({ ok: true; roundsRun: number } & RoleMatchResult)
  | { ok: false; raw: string; rounds: { label: string; sources: { title: string; url: string }[] }[] };

export function RoleMatchCard({ output }: { output: Output }) {
  if (!output.ok) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">A síntese não veio em JSON válido; resultado bruto:</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{output.raw}</pre>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-end justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">aderência à vaga</span>
          <span className="text-3xl font-semibold tabular-nums text-primary">{output.match.score}%</span>
        </div>
        <Progress value={output.match.score} className="mt-1 h-2" />
        <p className="mt-1 text-[11px] text-muted-foreground">{output.roundsRun} rodadas de web search</p>
      </div>

      {output.roles.map((r, i) => (
        <div key={i} className="rounded-md border p-3 text-sm">
          <div className="font-semibold">
            {r.title}
            {r.company && <span className="font-normal text-muted-foreground"> · {r.company}</span>}
            {r.seniority && <Badge variant="outline" className="ml-2">{r.seniority}</Badge>}
          </div>
          {r.mustHave.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Obrigatórios</div>
              <ul className="list-disc pl-4 text-xs">{r.mustHave.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
          {r.atsKeywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {r.atsKeywords.map((k) => (
                <Badge key={k} variant="secondary">{k}</Badge>
              ))}
            </div>
          )}
          {r.marketInsights.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mercado</div>
              <ul className="list-disc pl-4 text-xs">{r.marketInsights.slice(0, 6).map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
          {r.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.sources.slice(0, 5).map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <ExternalLinkIcon className="size-3" /> {s.title.slice(0, 40)}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-md bg-success/10 p-2 text-xs">
          <div className="mb-1 font-semibold text-success">Já evidenciado</div>
          <ul className="list-disc pl-4">{output.match.matched.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
        <div className="rounded-md bg-destructive/10 p-2 text-xs">
          <div className="mb-1 font-semibold text-destructive">Faltando / fraco</div>
          <ul className="list-disc pl-4">{output.match.missing.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      </div>
      {output.match.suggestions.length > 0 && (
        <ol className="list-decimal space-y-1 pl-4 text-sm">
          {output.match.suggestions.map((s) => <li key={s}>{s}</li>)}
        </ol>
      )}
    </div>
  );
}
