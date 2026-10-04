"use client";

import { motion } from "motion/react";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, GitCompareIcon, HistoryIcon, RotateCcwIcon, XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CvVersion } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

const when = (at: number) => {
  const d = new Date(at);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

type MenuProps = {
  versions: CvVersion[];
  /** Número da versão atual (= versions.length + 1). */
  current: number;
  /** Índice em `versions` sendo visualizado, ou null para a atual. */
  viewing: number | null;
  onSelect: (index: number | null) => void;
};

/** Chip "vN" do cabeçalho: abre a lista de versões, da mais nova para a mais antiga. */
export function VersionMenu({ versions, current, viewing, onSelect }: MenuProps) {
  const label = viewing === null ? `v${current}` : `v${viewing + 1} de ${current}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          title="Histórico de versões"
          className={cn(
            "ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors",
            viewing === null
              ? "border-primary/30 bg-accent text-accent-foreground hover:border-primary/60"
              : "border-primary bg-primary text-primary-foreground",
          )}
        >
          <HistoryIcon className="size-3" />
          {label}
          <ChevronDownIcon className="size-3 opacity-70" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-64 rounded-xl p-1">
        <DropdownMenuLabel className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Versões do CV
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onSelect(null)} className="rounded-lg">
          <Row n={current} label="atual" active={viewing === null} />
        </DropdownMenuItem>
        {versions.length > 0 && <DropdownMenuSeparator />}
        {[...versions].reverse().map((v, k) => {
          const index = versions.length - 1 - k;
          return (
            <DropdownMenuItem key={index} onSelect={() => onSelect(index)} className="rounded-lg">
              <Row n={index + 1} label={v.label ?? "versão anterior"} at={v.at} active={viewing === index} />
            </DropdownMenuItem>
          );
        })}
        {versions.length === 0 && <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Ainda não há versões anteriores.</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Row({ n, label, at, active }: { n: number; label: string; at?: number; active: boolean }) {
  return (
    <span className="flex w-full items-center gap-2 text-[12.5px]">
      <span className={cn("w-7 shrink-0 font-mono font-semibold", active ? "text-primary" : "text-foreground/80")}>v{n}</span>
      <span className="min-w-0 flex-1 truncate text-foreground/85">{label}</span>
      {at !== undefined && <span className="shrink-0 text-[11px] text-muted-foreground">{when(at)}</span>}
      {active && <CheckIcon className="size-3.5 shrink-0 text-primary" />}
    </span>
  );
}

type BarProps = {
  versions: CvVersion[];
  current: number;
  viewing: number;
  showDiff: boolean;
  onNavigate: (index: number | null) => void;
  onToggleDiff: () => void;
  onRestore: () => void;
};

/** Barra acima da folha enquanto uma versão antiga está aberta. */
export function VersionBar({ versions, current, viewing, showDiff, onNavigate, onToggleDiff, onRestore }: BarProps) {
  const v = versions[viewing];
  const hasPrev = viewing > 0;
  const hasNext = viewing < versions.length - 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="glass mb-3 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-[12.5px]"
    >
      <div className="flex items-center gap-0.5">
        <NavButton label="Versão anterior" disabled={!hasPrev} onClick={() => onNavigate(viewing - 1)}>
          <ChevronLeftIcon className="size-4" />
        </NavButton>
        <NavButton label="Versão seguinte" disabled={!hasNext && false} onClick={() => onNavigate(hasNext ? viewing + 1 : null)}>
          <ChevronRightIcon className="size-4" />
        </NavButton>
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-primary">v{viewing + 1}</span>
        <span className="text-muted-foreground"> de {current} · </span>
        <span>{v.label ?? "versão anterior"}</span>
        <span className="text-muted-foreground"> · {when(v.at)}</span>
        {showDiff && <span className="text-muted-foreground"> · comparando com v{current} (atual)</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <Pill onClick={onToggleDiff} active={showDiff}>
          <GitCompareIcon className="size-3.5" /> {showDiff ? "Ocultar diff" : "Diff com a atual"}
        </Pill>
        <Pill onClick={onRestore} accent>
          <RotateCcwIcon className="size-3.5" /> Restaurar
        </Pill>
        <NavButton label="Voltar à versão atual" onClick={() => onNavigate(null)}>
          <XIcon className="size-4" />
        </NavButton>
      </div>
    </motion.div>
  );
}

function NavButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
    >
      {children}
    </motion.button>
  );
}

function Pill({ onClick, active, accent, children }: { onClick: () => void; active?: boolean; accent?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
        accent
          ? "bg-primary text-primary-foreground hover:brightness-110"
          : active
            ? "bg-primary/15 text-primary ring-1 ring-primary/40"
            : "bg-background/40 text-foreground/85 ring-1 ring-glass-border hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </motion.button>
  );
}
