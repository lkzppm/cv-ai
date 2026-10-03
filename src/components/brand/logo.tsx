import { cn } from "@/lib/utils";
import { CvAgentIcon } from "./cv-agent-icon";

export function Logo({
  className,
  compact = false,
  size = "md",
}: {
  className?: string;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <div className={cn("flex items-center select-none", lg ? "gap-2.5" : "gap-2", className)}>
      <CvAgentIcon className={cn("shrink-0 text-primary", lg ? "size-7" : "size-5")} />
      {!compact && (
        <span className={cn("font-semibold tracking-tight", lg ? "text-[19px]" : "text-[15px]")}>
          CV<span className="text-gradient">Agent</span>
        </span>
      )}
    </div>
  );
}
