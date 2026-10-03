import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="relative grid size-8 place-items-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-cool))] text-[11px] font-bold tracking-tight text-white shadow-[0_8px_24px_-8px_var(--brand)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.45),transparent_55%)]" />
        <span className="relative">cv</span>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight">
          CV<span className="text-gradient">Agent</span>
        </span>
      )}
    </div>
  );
}
