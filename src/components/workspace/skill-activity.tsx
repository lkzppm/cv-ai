"use client";

import { BookOpenIcon, CheckIcon, ChevronDownIcon, WrenchIcon, XIcon } from "lucide-react";
import type { ToolUIPart } from "ai";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SKILLS_META } from "@/lib/skills-meta";
import { cn } from "@/lib/utils";

type State = ToolUIPart["state"];

/**
 * Linha "skill carregada": aparece quando o agente chama `load_skill`.
 * Distingue visualmente o *carregar instruções* (livro, borda tracejada)
 * do *executar a tool* (chave, card sólido).
 */
export function SkillLoadedRow({
  name,
  state,
  alreadyLoaded,
  description,
  instructions,
}: {
  name?: string;
  state: State;
  alreadyLoaded?: boolean;
  description?: string;
  instructions?: string;
}) {
  const meta = SKILLS_META.find((m) => m.key === name);
  const Icon = meta?.icon ?? BookOpenIcon;
  const loading = state === "input-streaming" || state === "input-available";
  const failed = state === "output-error";

  return (
    <Collapsible className="group/skill rounded-xl border border-dashed border-primary/40 bg-primary/[0.06]">
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3 py-2 text-left">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">skill</span>
        <span className="truncate text-sm font-medium">{name ?? "…"}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {loading ? (
            <Shimmer>carregando instruções…</Shimmer>
          ) : failed ? (
            <>
              <XIcon className="size-3 text-destructive" /> falhou
            </>
          ) : (
            <>
              <BookOpenIcon className="size-3 text-primary" />
              {alreadyLoaded ? "já carregada" : "instruções carregadas"}
            </>
          )}
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/skill:rotate-180" />
      </CollapsibleTrigger>
      {(description || instructions) && (
        <CollapsibleContent className="space-y-2 px-3 pb-3">
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {instructions && (
            <pre className="scrollbar-none max-h-56 overflow-auto rounded-lg bg-background/40 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {instructions}
            </pre>
          )}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

/** Cabeçalho do card de execução de uma tool de skill (pt-BR, com ícone da skill). */
export function SkillToolHeader({ name, state, subtitle }: { name: string; state: State; subtitle?: string }) {
  const meta = SKILLS_META.find((m) => m.key === name);
  const Icon = meta?.icon ?? WrenchIcon;
  return (
    <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">tool</span>
        <span className="truncate text-sm font-medium">
          {name}
          {subtitle && <span className="text-muted-foreground"> · {subtitle}</span>}
        </span>
        <StatePill state={state} />
      </div>
      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
}

function StatePill({ state }: { state: State }) {
  const base = "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium";
  if (state === "output-available")
    return (
      <span className={cn(base, "bg-success/12 text-success")}>
        <CheckIcon className="size-3" /> concluída
      </span>
    );
  if (state === "output-error")
    return (
      <span className={cn(base, "bg-destructive/12 text-destructive")}>
        <XIcon className="size-3" /> erro
      </span>
    );
  return (
    <span className={cn(base, "bg-primary/12 text-primary")}>
      <span className="pulse-dot size-1.5 rounded-full bg-primary" />
      {state === "input-streaming" ? "preparando…" : "executando…"}
    </span>
  );
}
