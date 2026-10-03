import { cn } from "@/lib/utils";
import { CvAgentIcon } from "./cv-agent-icon";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary ring-1 ring-primary/25">
        <CvAgentIcon className="size-5" />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight">
          CV<span className="text-gradient">Agent</span>
        </span>
      )}
    </div>
  );
}
