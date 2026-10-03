"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIMessage } from "ai";
import { SAMPLE_CV } from "@/lib/cv/sample";

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  cv: string;
  /** Versões anteriores do CV (mais recente por último) para desfazer. */
  cvHistory: string[];
  messages: UIMessage[];
};

type State = {
  sessions: Session[];
  activeId: string | null;
  theme: "light" | "dark";
};

type Actions = {
  createSession: (opts?: { cv?: string; title?: string }) => string;
  setActive: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setCv: (cv: string, opts?: { recordHistory?: boolean }) => void;
  undoCv: () => void;
  setMessages: (id: string, messages: UIMessage[]) => void;
  toggleTheme: () => void;
};

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const useSessions = create<State & Actions>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeId: null,
      theme: "light",

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
      setCv: (cv, { recordHistory = true } = {}) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === s.activeId
              ? {
                  ...x,
                  cv,
                  cvHistory: recordHistory && x.cv !== cv ? [...x.cvHistory.slice(-19), x.cv] : x.cvHistory,
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
            const cv = history.pop()!;
            return { ...x, cv, cvHistory: history, updatedAt: Date.now() };
          }),
        })),
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
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "cv-ai:sessions", version: 1 },
  ),
);

export const useActiveSession = () =>
  useSessions((s) => s.sessions.find((x) => x.id === s.activeId) ?? null);
