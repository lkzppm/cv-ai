"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MoonIcon, SunIcon, PanelLeftIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { AmbientCanvas } from "@/components/ambient/ambient-canvas";
import { CHAT_WIDTH, useActiveSession, useSessions } from "@/lib/store/sessions";
import { useMobileChat } from "@/lib/store/mobile-chat";
import { BELOW_LG, BELOW_MD, useMediaQuery } from "@/lib/use-media-query";
import { SessionsRail } from "./sessions-rail";
import { CvPanel } from "./cv-panel";
import { HomeScreen } from "./home-screen";
import { AgentSidebar } from "./agent-sidebar";
import { AboutDialog } from "./about-dialog";
import { cn } from "@/lib/utils";

/**
 * Layout em 3 colunas sobre o fundo de fluido:
 *  [ rail de sessões ] [ CV atual (folha flutuante) ] [ agente ]
 * Sem nenhuma sessão, o centro vira a homepage e a coluna do agente some.
 *
 * Telas pequenas: abaixo de `md` o rail abre em tela cheia; abaixo de `lg` o
 * agente sai da coluna e vira um painel sobreposto (tela cheia no celular),
 * aberto pelo botão de chat da toolbar do CV. É sempre a mesma instância do
 * `AgentSidebar`, montada o tempo todo, para o streaming não cair ao fechar.
 */
export function AppShell() {
  const session = useActiveSession();
  const hasHydrated = useHydrated();
  const theme = useSessions((s) => s.theme);
  const toggleTheme = useSessions((s) => s.toggleTheme);
  const [railOpen, setRailOpen] = useState(false);
  const chatWidth = useSessions((s) => s.chatWidth);
  const setChatWidth = useSessions((s) => s.setChatWidth);
  const { dragging, onPointerDown } = useResize(setChatWidth);
  const railOverlay = useMediaQuery(BELOW_MD);
  const chatOverlay = useMediaQuery(BELOW_LG);
  const chatOpen = useMobileChat((s) => s.open);
  const hideChat = useMobileChat((s) => s.hide);
  const sessionId = session?.id;
  const closeRail = useCallback(() => setRailOpen(false), []);
  const mainRef = useRef<HTMLElement>(null);

  // Trocar de sessão (ou voltar à homepage) sempre começa pelo CV, do topo:
  // o <main> é o mesmo container de rolagem para a homepage e para todas as sessões.
  useEffect(() => {
    hideChat();
    mainRef.current?.scrollTo({ top: 0 });
  }, [sessionId, hideChat]);

  // Com um painel sobreposto aberto, o que fica atrás (header e CV) sai do foco e da leitura de tela.
  const overlayOpen = (railOverlay && railOpen) || (chatOverlay && chatOpen);
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      // Esc num <input> é do próprio campo (renomear sessão).
      if (e.key !== "Escape" || e.defaultPrevented || e.target instanceof HTMLInputElement) return;
      hideChat();
      if (railOverlay) closeRail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, railOverlay, hideChat, closeRail]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <AmbientCanvas />

      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        inert={overlayOpen}
        className="relative z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-3"
      >
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={() => setRailOpen((v) => !v)} aria-label="Alternar sessões" className="rounded-xl">
            <PanelLeftIcon />
          </Button>
        </div>

        <div className="relative">
          <div className="glass flex items-center gap-1 rounded-full py-1.5 pr-2 pl-4 shadow-[0_16px_40px_-20px_rgba(0,0,0,.6)]">
            <Logo size="lg" />
            <AboutDialog />
          </div>
          {/* Sem sessão (homepage): setinha à direita do ⓘ apontando para ele */}
          <AnimatePresence>
            {hasHydrated && !session && (
              <motion.div
                key="info-hint"
                aria-hidden
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="pointer-events-none absolute top-1/2 left-full ml-1.5 hidden -translate-y-1/2 items-start gap-1 whitespace-nowrap md:flex"
              >
                <motion.svg
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  viewBox="0 0 64 40"
                  className="h-10 w-16 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* haste em S: sai horizontal do texto (embaixo, à direita), sobe e chega horizontal no vértice da ponta */}
                  <path d="M62 34 C 44 34, 36 20, 10 20" strokeDasharray="4 4.5" />
                  {/* ponta aberta, simétrica em torno do fim da haste (10,20) = centro vertical da pílula */}
                  <path d="M18 13 L10 20 L18 27" />
                </motion.svg>
                <span className="mt-[26px] text-[12px] leading-4 text-muted-foreground">o que ele sabe fazer</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon-sm" className="rounded-xl max-[359px]:hidden" aria-label="GitHub">
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

      {/* max-lg:z-30: os painéis sobrepostos vivem neste contexto e precisam cobrir o header (z-20) */}
      <div className={cn("relative z-10 flex min-h-0 flex-1 px-3 pb-3 max-lg:z-30", dragging && "cursor-col-resize")}>
        {/* a `key` remonta o rail ao cruzar o corte: os dois modos animam propriedades diferentes */}
        {railOverlay ? (
          <motion.aside
            key="rail-overlay"
            initial={false}
            animate={{ x: railOpen ? "0%" : "-100%", opacity: railOpen ? 1 : 0 }}
            transition={OVERLAY_TRANSITION}
            inert={!railOpen}
            className="surface-sheet fixed inset-0 z-50 overflow-hidden"
          >
            <SessionsRail onClose={closeRail} />
          </motion.aside>
        ) : (
          <motion.aside
            key="rail-inline"
            initial={false}
            animate={{ width: railOpen ? 248 : 0, opacity: railOpen ? 1 : 0, x: railOpen ? 0 : -12, marginRight: railOpen ? 12 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            inert={!railOpen}
            className="glass mr-3 shrink-0 overflow-hidden rounded-2xl"
          >
            <div className="h-full w-[248px]">
              <SessionsRail />
            </div>
          </motion.aside>
        )}

        <main ref={mainRef} inert={overlayOpen} className="scrollbar-none relative min-w-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {hasHydrated && session ? (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.985 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-full pt-3 sm:px-6 sm:pt-5 md:px-10"
              >
                <CvPanel />
              </motion.div>
            ) : hasHydrated ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.985 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-full px-3 pt-5 sm:px-6 md:px-10"
              >
                <HomeScreen />
              </motion.div>
            ) : (
              <motion.div key="loading" className="grid h-full place-items-center" exit={{ opacity: 0 }}>
                <Logo className="animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* divisor arrastável entre o CV e o chat: só com sessão */}
        {hasHydrated && session && (
          <>
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

        {/* véu atrás do painel do chat (visível de `sm` a `lg`, onde ele não cobre a tela toda) */}
        <AnimatePresence>
          {chatOverlay && chatOpen && (
            <motion.div
              key="chat-scrim"
              aria-hidden
              onClick={hideChat}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/45"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={chatOverlay ? { x: "100%", opacity: 0 } : { x: 32, opacity: 0 }}
          animate={chatOverlay ? { x: chatOpen ? "0%" : "100%", opacity: chatOpen ? 1 : 0 } : { x: 0, opacity: 1 }}
          transition={chatOverlay ? OVERLAY_TRANSITION : { duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ "--chat-width": `${chatWidth}px` } as React.CSSProperties}
          inert={chatOverlay && !chatOpen}
          className={cn(
            "flex flex-col overflow-hidden",
            chatOverlay
              ? "surface-sheet fixed inset-y-0 right-0 z-50 w-full sm:max-w-[480px] sm:border-l sm:border-glass-border sm:shadow-[-24px_0_60px_-28px_rgba(0,0,0,.6)]"
              : "glass-clear w-(--chat-width) shrink-0 rounded-2xl",
            dragging && "select-none",
          )}
        >
          {chatOverlay && (
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-glass-border pr-2 pl-4">
              <Logo compact />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[14px] font-semibold tracking-tight">Agente</div>
                <div className="truncate text-[11px] text-muted-foreground">{session.title}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={hideChat} aria-label="Fechar o chat e voltar ao currículo" className="rounded-xl">
                <XIcon />
              </Button>
            </div>
          )}
          <AgentSidebar key={session.id} />
        </motion.aside>
          </>
        )}
      </div>
    </div>
  );
}

/** Painéis em tela cheia: tween em vez de spring, para não passar do ponto e abrir uma fresta na borda. */
const OVERLAY_TRANSITION = { duration: 0.42, ease: [0.16, 1, 0.3, 1] } as const;

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
