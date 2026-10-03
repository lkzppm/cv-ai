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
    <div className={cn("flex items-center select-none", lg ? "gap-3" : "gap-2.5", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-accent text-primary ring-1 ring-primary/25",
          lg ? "size-9" : "size-8",
        )}
      >
        <CvAgentIcon className={lg ? "size-6" : "size-5"} />
      </span>
      {!compact && (
        <span className={cn("font-semibold tracking-tight", lg ? "text-[19px]" : "text-[15px]")}>
          CV<span className="text-gradient">Agent</span>
        </span>
      )}
    </div>
  );
}
