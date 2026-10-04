"use client";

import { ScanSearchIcon } from "lucide-react";
import type { CvHighlight } from "@/lib/cv/refs";
import { highlightKey, useHighlights } from "@/lib/store/highlights";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  item: CvHighlight;
  /** Esconde o ícone de "localizar" (para linhas muito densas). */
  bare?: boolean;
};

/**
 * Linha de um tool card ligada a trechos do CV: passar o mouse mostra o
 * destaque no painel; clicar fixa (e clicar de novo solta). Sem refs,
 * renderiza um div comum.
 */
export function Highlightable({ item, bare, className, children, onClick, ...props }: Props) {
  const focusedKey = useHighlights((s) => s.focusedKey);
  const setHover = useHighlights((s) => s.setHover);
  const toggleFocus = useHighlights((s) => s.toggleFocus);
  const hasRefs = item.refs.length > 0;
  const focused = hasRefs && focusedKey === highlightKey(item);

  if (!hasRefs) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={focused}
      title="Mostrar no CV"
      onMouseEnter={() => setHover(item)}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        toggleFocus(item);
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFocus(item);
        }
      }}
      className={cn(
        "group/hl relative cursor-pointer rounded-md transition-colors outline-none",
        "hover:bg-primary/[0.06] focus-visible:ring-1 focus-visible:ring-primary/40",
        focused && "bg-primary/[0.08] ring-1 ring-primary/40",
        className,
      )}
      {...props}
    >
      {children}
      {!bare && (
        <ScanSearchIcon
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1.5 right-1.5 size-3.5 text-primary transition-opacity",
            focused ? "opacity-90" : "opacity-0 group-hover/hl:opacity-70",
          )}
        />
      )}
    </div>
  );
}
