"use client";

import { AnimatePresence, motion } from "motion/react";
import { PlusIcon, Trash2Icon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

export function SessionsRail() {
  const sessions = useSessions((s) => s.sessions);
  const activeId = useSessions((s) => s.activeId);
  const setActive = useSessions((s) => s.setActive);
  const createSession = useSessions((s) => s.createSession);
  const deleteSession = useSessions((s) => s.deleteSession);

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-3 pb-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => createSession()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-12px_var(--brand)] hover:brightness-110"
        >
          <PlusIcon className="size-4" /> Nova sessão
        </motion.button>
      </div>
      <div className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Sessões
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {sessions.map((s) => {
              const active = s.id === activeId;
              return (
                <motion.li
                  key={s.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="group relative"
                >
                  <button
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "relative flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="session-active"
                        className="absolute inset-0 rounded-xl bg-accent ring-1 ring-primary/30"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <FileTextIcon className={cn("relative mt-0.5 size-4 shrink-0", active ? "text-primary" : "")} />
                    <span className="relative min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.title}</span>
                      <span className="block text-[11px] opacity-70">
                        {new Date(s.updatedAt).toLocaleDateString("pt-BR")} · {s.messages.length} msgs
                      </span>
                    </span>
                  </button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteSession(s.id)}
                    aria-label="Excluir sessão"
                  >
                    <Trash2Icon className="text-muted-foreground" />
                  </Button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </ScrollArea>
      <div className="border-t border-glass-border p-3 text-[11px] leading-snug text-muted-foreground">
        Cada sessão guarda um CV, suas versões e a conversa com o agente.
      </div>
    </div>
  );
}
