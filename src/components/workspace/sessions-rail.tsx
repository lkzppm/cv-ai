"use client";

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
    <div className="flex h-full w-60 flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sessões</span>
        <Button size="icon-xs" variant="outline" onClick={() => createSession()} aria-label="Nova sessão">
          <PlusIcon />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li key={s.id} className="group relative">
              <button
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent",
                  s.id === activeId && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <FileTextIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.title}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {new Date(s.updatedAt).toLocaleDateString("pt-BR")} · {s.messages.length} msgs
                  </span>
                </span>
              </button>
              <Button
                size="icon-xs"
                variant="ghost"
                className="absolute top-1.5 right-1 opacity-0 group-hover:opacity-100"
                onClick={() => deleteSession(s.id)}
                aria-label="Excluir sessão"
              >
                <Trash2Icon className="text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <div className="border-t p-3 text-[11px] leading-snug text-muted-foreground">
        Cada sessão guarda um CV, seu histórico de versões e a conversa com o agente (localStorage).
      </div>
    </div>
  );
}
