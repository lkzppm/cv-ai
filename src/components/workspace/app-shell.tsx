"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon, PanelLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { AmbientCanvas } from "@/components/ambient/ambient-canvas";
import { useActiveSession, useSessions } from "@/lib/store/sessions";
import { SessionsRail } from "./sessions-rail";
import { CvPanel } from "./cv-panel";
import { AgentSidebar } from "./agent-sidebar";
import { cn } from "@/lib/utils";

/**
 * Layout em 3 colunas (inspirado no Claude Design):
 *  [ sessões ] [ CV atual (principal) ] [ agente: chat + skills + propostas ]
 */
export function AppShell() {
  const session = useActiveSession();
  const createSession = useSessions((s) => s.createSession);
  const hasHydrated = useHydrated();
  const theme = useSessions((s) => s.theme);
  const toggleTheme = useSessions((s) => s.toggleTheme);
  const [railOpen, setRailOpen] = useState(true);

  useEffect(() => {
    if (hasHydrated && !session) createSession();
  }, [hasHydrated, session, createSession]);

  if (!hasHydrated || !session) {
    return (
      <div className="relative flex h-dvh items-center justify-center">
        <AmbientCanvas />
        <Logo className="relative animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <AmbientCanvas className="opacity-90" />

      <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-card/70 px-3 backdrop-blur-md">
        <Button variant="ghost" size="icon-sm" onClick={() => setRailOpen((v) => !v)} aria-label="Alternar sessões">
          <PanelLeftIcon />
        </Button>
        <Logo />
        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
          agente de currículo com skills · Next.js + AI SDK + Groq
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <aside
          className={cn(
            "shrink-0 border-r bg-sidebar/80 backdrop-blur-md transition-[width] duration-200",
            railOpen ? "w-60" : "w-0 overflow-hidden border-r-0",
          )}
        >
          <SessionsRail />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <CvPanel key={session.id} />
        </main>

        <aside className="hidden w-[420px] shrink-0 border-l bg-sidebar/85 backdrop-blur-md lg:flex lg:flex-col xl:w-[480px]">
          <AgentSidebar key={session.id} />
        </aside>
      </div>
    </div>
  );
}

/** Evita mismatch de hidratação com o localStorage da store. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
