"use client";

import { create } from "zustand";

/**
 * Proposta pendente do cv_editor, revisada como diff dentro do painel do CV.
 * Não persiste: depois de recarregar, o card oferece "Revisar no CV" de novo.
 */
export type EditProposal = {
  toolCallId: string;
  newCv: string;
  summary: string[];
};

type State = { pending: EditProposal | null };
type Actions = {
  propose: (p: EditProposal) => void;
  /** Recusar um hunk reescreve a proposta sem aquele trecho. */
  updateProposal: (newCv: string) => void;
  dismiss: () => void;
};

export const useEditProposal = create<State & Actions>()((set) => ({
  pending: null,
  propose: (pending) => set({ pending }),
  updateProposal: (newCv) => set((s) => (s.pending ? { pending: { ...s.pending, newCv } } : s)),
  dismiss: () => set({ pending: null }),
}));
