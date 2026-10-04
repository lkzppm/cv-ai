"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMessage } from "ai";
import { SAMPLE_CV } from "@/lib/cv/sample";

/** Uma versão anterior do CV: texto, quando foi substituída e por quem. */
export type CvVersion = { cv: string; at: number; label?: string };

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  cv: string;
  /** Versões anteriores do CV (mais antiga primeiro); a atual é `cv` = v(length + 1). */
  cvHistory: CvVersion[];
  messages: UIMessage[];
};

type State = {
  sessions: Session[];
  activeId: string | null;
  theme: "light" | "dark";
  /** Largura da sidebar do agente (px), ajustável pelo divisor. */
  chatWidth: number;
};

type Actions = {
  createSession: (opts?: { cv?: string; title?: string }) => string;
  setActive: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setCv: (cv: string, opts?: { recordHistory?: boolean; label?: string }) => void;
  undoCv: () => void;
  /** Torna uma versão antiga a atual, registrando a atual no histórico. */
  restoreCv: (index: number) => void;
  setMessages: (id: string, messages: UIMessage[]) => void;
  toggleTheme: () => void;
  setChatWidth: (px: number) => void;
};

export const CHAT_WIDTH = { min: 360, max: 820, default: 460 };

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const useSessions = create<State & Actions>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeId: null,
      theme: "dark",
      chatWidth: CHAT_WIDTH.default,

      createSession: ({ cv = SAMPLE_CV, title } = {}) => {
        const id = newId();
        const now = Date.now();
        const session: Session = {
          id,
          title: title ?? `Sessão ${get().sessions.length + 1}`,
          createdAt: now,
          updatedAt: now,
          cv,
          cvHistory: [],
          messages: [],
        };
        set((s) => ({ sessions: [session, ...s.sessions], activeId: id }));
        return id;
      },
      setActive: (id) => set({ activeId: id }),
      deleteSession: (id) =>
        set((s) => {
          const sessions = s.sessions.filter((x) => x.id !== id);
          return { sessions, activeId: s.activeId === id ? (sessions[0]?.id ?? null) : s.activeId };
        }),
      renameSession: (id, title) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, title, updatedAt: Date.now() } : x)) })),
      setCv: (cv, { recordHistory = true, label } = {}) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === s.activeId
              ? {
                  ...x,
                  cv,
                  cvHistory:
                    recordHistory && x.cv !== cv ? [...x.cvHistory.slice(-19), { cv: x.cv, at: Date.now(), label }] : x.cvHistory,
                  updatedAt: Date.now(),
                }
              : x,
          ),
        })),
      undoCv: () =>
        set((s) => ({
          sessions: s.sessions.map((x) => {
            if (x.id !== s.activeId || x.cvHistory.length === 0) return x;
            const history = [...x.cvHistory];
            const { cv } = history.pop()!;
            return { ...x, cv, cvHistory: history, updatedAt: Date.now() };
          }),
        })),
      restoreCv: (index) => {
        const session = get().sessions.find((x) => x.id === get().activeId);
        const version = session?.cvHistory[index];
        if (!version) return;
        get().setCv(version.cv, { label: `restaurada de v${index + 1}` });
      },
      setMessages: (id, messages) =>
        set((s) => ({
          sessions: s.sessions.map((x) => {
            if (x.id !== id) return x;
            const firstUser = messages.find((m) => m.role === "user");
            const firstText = firstUser?.parts.find((p) => p.type === "text")?.text;
            const title = x.title.startsWith("Sessão ") && firstText ? firstText.slice(0, 40) : x.title;
            return { ...x, messages, title, updatedAt: Date.now() };
          }),
        })),
      setChatWidth: (px) => set({ chatWidth: Math.round(Math.min(CHAT_WIDTH.max, Math.max(CHAT_WIDTH.min, px))) }),
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        // View Transitions API quando disponível: crossfade suave entre temas
        const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
        if (doc.startViewTransition) doc.startViewTransition(() => set({ theme: next }));
        else set({ theme: next });
      },
    }),
    {
      name: "cv-ai:sessions",
      version: 3,
      migrate: (persisted, version) => {
        let state = persisted as State;
        if (version < 2) state = { ...state, theme: "dark" as const };
        if (version < 3) {
          // v2 guardava só o texto de cada versão.
          state = {
            ...state,
            sessions: state.sessions.map((x) => ({
              ...x,
              cvHistory: (x.cvHistory as unknown as (string | CvVersion)[]).map((h) =>
                typeof h === "string" ? { cv: h, at: x.updatedAt, label: "versão anterior" } : h,
              ),
            })),
          };
        }
        return state;
      },
    },
  ),
);

export const useActiveSession = () =>
  useSessions((s) => s.sessions.find((x) => x.id === s.activeId) ?? null);
