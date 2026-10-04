"use client";

import { create } from "zustand";
import type { CvHighlight } from "@/lib/cv/refs";

/**
 * Destaques efêmeros no painel do CV (não persistem).
 *
 * Camadas, da mais prioritária para a menos:
 *  1. `hover`   — item do card sob o cursor (preview);
 *  2. `focused` — item clicado no card (fica até clicar de novo ou limpar);
 *  3. `pinned`  — tudo que a última tool mencionou (fixado quando a tool termina).
 */
type PinnedSet = { source: string; items: CvHighlight[] };

type State = {
  pinned: PinnedSet | null;
  focusedKey: string | null;
  hover: CvHighlight | null;
};

type Actions = {
  pin: (source: string, items: CvHighlight[]) => void;
  toggleFocus: (item: CvHighlight) => void;
  setHover: (item: CvHighlight | null) => void;
  clear: () => void;
};

/** Identidade estável de um item (os objetos são recriados a cada render). */
export const highlightKey = (h: CvHighlight) => `${h.label ?? ""}|${JSON.stringify(h.refs)}`;

export const useHighlights = create<State & Actions>()((set, get) => ({
  pinned: null,
  focusedKey: null,
  hover: null,

  pin: (source, items) =>
    set({ pinned: items.length ? { source, items } : null, focusedKey: null, hover: null }),
  toggleFocus: (item) => {
    const key = highlightKey(item);
    const { pinned, focusedKey } = get();
    if (focusedKey === key) return set({ focusedKey: null });
    // Focar um item que não está fixado o inclui no conjunto, para "limpar" apagar tudo.
    const has = pinned?.items.some((i) => highlightKey(i) === key);
    set({
      focusedKey: key,
      pinned: has ? pinned : { source: pinned?.source ?? "card", items: [...(pinned?.items ?? []), item] },
    });
  },
  setHover: (item) => set({ hover: item }),
  clear: () => set({ pinned: null, focusedKey: null, hover: null }),
}));

/** O que deve aparecer no painel agora, já resolvido pelas camadas. */
export function selectVisible(s: State): CvHighlight[] {
  if (s.hover) return [s.hover];
  if (s.focusedKey && s.pinned) {
    const f = s.pinned.items.find((i) => highlightKey(i) === s.focusedKey);
    if (f) return [f];
  }
  return s.pinned?.items ?? [];
}
