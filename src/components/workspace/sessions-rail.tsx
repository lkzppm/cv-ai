"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon, Trash2Icon, PencilIcon, CheckIcon, FileTextIcon, MessageSquareIcon, XIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

/**
 * `onClose` liga o modo tela cheia (celular): mostra o botão de fechar e fecha
 * o rail ao escolher ou criar uma sessão.
 */
export function SessionsRail({ onClose }: { onClose?: () => void }) {
  const sessions = useSessions((s) => s.sessions);
  const activeId = useSessions((s) => s.activeId);
  const setActive = useSessions((s) => s.setActive);
  const createSession = useSessions((s) => s.createSession);
  const deleteSession = useSessions((s) => s.deleteSession);
  const renameSession = useSessions((s) => s.renameSession);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const commitRename = (id: string) => {
    const title = draft.trim();
    if (title) renameSession(id, title);
    setEditing(null);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sessões
          </span>
          <div className="flex items-center gap-1.5">
            <IconButton
              label="Nova sessão"
              onClick={() => {
                createSession();
                onClose?.();
              }}
              accent
            >
              <PlusIcon className="size-4" strokeWidth={2.5} />
            </IconButton>
            {onClose && (
              <IconButton label="Fechar sessões" onClick={onClose}>
                <XIcon className="size-4" />
              </IconButton>
            )}
          </div>
        </div>

        {/* O Viewport do Radix envolve o conteúdo num div `display: table`, que cresce
            até a largura do título mais longo e empurra os botões para fora do rail. */}
        <ScrollArea className="scrollbar-none min-h-0 flex-1 px-2 pb-2 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <ul className="w-full min-w-0 space-y-1">
            <AnimatePresence initial={false}>
              {sessions.map((s) => {
                const active = s.id === activeId;
                const isEditing = editing === s.id;
                return (
                  <motion.li
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors",
                      active ? "bg-accent/80" : "hover:bg-accent/40",
                    )}
                  >
                    {active && <ActiveBracket />}

                    <button
                      onClick={() => {
                        setActive(s.id);
                        onClose?.();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      aria-current={active ? "true" : undefined}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                          active ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        <FileTextIcon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(s.id);
                              if (e.key === "Escape") setEditing(null);
                            }}
                            onBlur={() => commitRename(s.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-md bg-background/60 px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/40 pointer-coarse:text-base"
                          />
                        ) : (
                          <span className={cn("block truncate text-sm", active ? "font-medium text-foreground" : "text-foreground/85")}>
                            {s.title}
                          </span>
                        )}
                        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted-foreground">
                          <MessageSquareIcon className="size-3" />
                          {s.messages.length}
                          <span className="opacity-50">·</span>
                          {new Date(s.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      </span>
                    </button>

                    {/* ações: aparecem no hover; sempre visíveis no toque, que não tem hover */}
                    <div
                      className={cn(
                        "flex shrink-0 items-center gap-0.5 transition-opacity",
                        isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
                      )}
                    >
                      {isEditing ? (
                        <IconButton label="Salvar nome" onClick={() => commitRename(s.id)} small>
                          <CheckIcon className="size-3.5" />
                        </IconButton>
                      ) : (
                        <IconButton
                          label="Renomear"
                          small
                          onClick={() => {
                            setDraft(s.title);
                            setEditing(s.id);
                          }}
                        >
                          <PencilIcon className="size-3.5" />
                        </IconButton>
                      )}
                      <IconButton label="Excluir" small danger onClick={() => deleteSession(s.id)}>
                        <Trash2Icon className="size-3.5" />
                      </IconButton>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

/**
 * Indicador da sessão ativa: um "C" de 3px que abraça a borda esquerda do
 * item seguindo o raio do canto (rounded-xl = 12px), com pontas redondas e
 * espessura uniforme. Desenhado em SVG com a altura real do item.
 */
function ActiveBracket() {
  const ref = useRef<SVGSVGElement>(null);
  const [h, setH] = useState(0);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    // offsetHeight = border-box (contentRect ignora o padding do item e deixava o "C" curto)
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const r = 12; // raio do canto do item
  const sw = 3; // espessura
  const c = sw / 2; // deslocamento até a linha central do traço
  const cr = r - c; // raio da linha central
  const arm = 4; // braço horizontal do "C"
  const d =
    h > 2 * r
      ? `M ${r + arm} ${c} H ${r} A ${cr} ${cr} 0 0 0 ${c} ${r} V ${h - r} A ${cr} ${cr} 0 0 0 ${r} ${h - c} H ${r + arm}`
      : "";

  return (
    <motion.svg
      ref={ref}
      layoutId="session-active-bracket"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className="pointer-events-none absolute top-0 left-0 h-full text-primary"
      width={r + arm + sw}
      height={h || undefined}
      viewBox={`0 0 ${r + arm + sw} ${Math.max(h, 1)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {d && <path d={d} />}
    </motion.svg>
  );
}

function IconButton({
  label,
  onClick,
  children,
  accent = false,
  danger = false,
  small = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          aria-label={label}
          className={cn(
            "grid place-items-center rounded-lg transition-colors",
            small ? "size-7 pointer-coarse:size-9" : "size-8",
            accent
              ? "bg-primary text-primary-foreground hover:brightness-110"
              : danger
                ? "text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
          )}
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
