import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm">
        cv
      </span>
      {!compact && (
        <span className="font-semibold tracking-tight">
          CV<span className="text-primary">Agent</span>
        </span>
      )}
    </div>
  );
}
