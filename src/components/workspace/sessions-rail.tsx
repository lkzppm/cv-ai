"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon, Trash2Icon, PencilIcon, CheckIcon, FileTextIcon, MessageSquareIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

export function SessionsRail() {
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
          <IconButton label="Nova sessão" onClick={() => createSession()} accent>
            <PlusIcon className="size-4" strokeWidth={2.5} />
          </IconButton>
        </div>

        <ScrollArea className="scrollbar-none min-h-0 flex-1 px-2 pb-2">
          <ul className="space-y-1">
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
                    {active && (
                      <motion.span
                        layoutId="session-active-bar"
// barra sólida com pontas redondas, recuada para caber dentro da curva do canto
                        className="pointer-events-none absolute top-[9px] bottom-[9px] left-[5px] w-[3px] rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}

                    <button
                      onClick={() => setActive(s.id)}
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
                            className="w-full rounded-md bg-background/60 px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/40"
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

                    {/* ações: aparecem no hover */}
                    <div
                      className={cn(
                        "flex shrink-0 items-center gap-0.5 transition-opacity",
                        isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
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
            small ? "size-7" : "size-8",
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
