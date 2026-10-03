"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MoonIcon, SunIcon, PanelLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { AmbientCanvas } from "@/components/ambient/ambient-canvas";
import { CHAT_WIDTH, useActiveSession, useSessions } from "@/lib/store/sessions";
import { SessionsRail } from "./sessions-rail";
import { CvPanel } from "./cv-panel";
import { AgentSidebar } from "./agent-sidebar";
import { AboutDialog } from "./about-dialog";
import { cn } from "@/lib/utils";

/**
 * Layout em 3 colunas sobre o fundo de fluido:
 *  [ rail de sessões ] [ CV atual (folha flutuante) ] [ agente ]
 */
export function AppShell() {
  const session = useActiveSession();
  const createSession = useSessions((s) => s.createSession);
  const hasHydrated = useHydrated();
  const theme = useSessions((s) => s.theme);
  const toggleTheme = useSessions((s) => s.toggleTheme);
  const [railOpen, setRailOpen] = useState(false);
  const chatWidth = useSessions((s) => s.chatWidth);
  const setChatWidth = useSessions((s) => s.setChatWidth);
  const { dragging, onPointerDown } = useResize(setChatWidth);

  useEffect(() => {
    if (hasHydrated && !session) createSession();
  }, [hasHydrated, session, createSession]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <AmbientCanvas />

      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-3"
      >
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={() => setRailOpen((v) => !v)} aria-label="Alternar sessões" className="rounded-xl">
            <PanelLeftIcon />
          </Button>
        </div>

        <div className="glass flex items-center gap-1 rounded-full py-1.5 pr-2 pl-4 shadow-[0_16px_40px_-20px_rgba(0,0,0,.6)]">
          <Logo size="lg" />
          <AboutDialog />
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon-sm" className="rounded-xl" aria-label="GitHub">
            <a href="https://github.com/lkzppm/cv-ai" target="_blank" rel="noreferrer">
              <GitHubMark />
            </a>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Alternar tema" className="rounded-xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.25 }}
                className="grid place-items-center"
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </motion.header>

      <div className={cn("relative z-10 flex min-h-0 flex-1 px-3 pb-3", dragging && "cursor-col-resize")}>
        <motion.aside
          initial={false}
          animate={{ width: railOpen ? 248 : 0, opacity: railOpen ? 1 : 0, x: railOpen ? 0 : -12, marginRight: railOpen ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="glass mr-3 shrink-0 overflow-hidden rounded-2xl"
        >
          <div className="w-[248px]">
            <SessionsRail />
          </div>
        </motion.aside>

        <main className="scrollbar-none relative min-w-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {hasHydrated && session ? (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.985 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-full px-6 pt-5 md:px-10"
              >
                <CvPanel />
              </motion.div>
            ) : (
              <motion.div key="loading" className="grid h-full place-items-center" exit={{ opacity: 0 }}>
                <Logo className="animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* divisor arrastável entre o CV e o chat */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painel do agente"
          onPointerDown={onPointerDown}
          onDoubleClick={() => setChatWidth(CHAT_WIDTH.default)}
          className="group hidden w-3 shrink-0 cursor-col-resize items-center justify-center lg:flex"
        >
          <span
            className={cn(
              "h-12 w-1 rounded-full transition-all duration-200",
              dragging ? "h-20 bg-primary" : "bg-foreground/15 group-hover:h-16 group-hover:bg-primary/70",
            )}
          />
        </div>

        <motion.aside
          initial={{ x: 32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: chatWidth }}
          className={cn("glass-clear hidden shrink-0 overflow-hidden rounded-2xl lg:flex lg:flex-col", dragging && "select-none")}
        >
          {hasHydrated && session && <AgentSidebar key={session.id} />}
        </motion.aside>
      </div>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

/** Arrasto horizontal do divisor: a largura do chat = distância do cursor até a borda direita. */
function useResize(setWidth: (px: number) => void) {
  const [dragging, setDragging] = useState(false);
  const frame = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
      const onMove = (ev: PointerEvent) => {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          // 12px = padding direito do container (px-3)
          setWidth(window.innerWidth - ev.clientX - 12);
        });
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [setWidth],
  );

  return { dragging, onPointerDown };
}

/** Evita mismatch de hidratação com o localStorage da store. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
