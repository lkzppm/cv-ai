"use client";

import { create } from "zustand";

/**
 * Abaixo de `lg` o chat do agente é um painel sobreposto ao CV (tela cheia no
 * celular). Fica numa store porque os dois lados se chamam: uma marcação do CV
 * abre o chat (`revealInChat`) e um item de card fecha o chat para mostrar o CV.
 * No desktop o chat está sempre visível e `open` é ignorado. Não persiste.
 */
type State = {
  open: boolean;
  /** O agente está respondendo (ponto pulsante no botão do chat). */
  busy: boolean;
};

type Actions = {
  show: () => void;
  hide: () => void;
  setBusy: (busy: boolean) => void;
};

export const useMobileChat = create<State & Actions>()((set) => ({
  open: false,
  busy: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  setBusy: (busy) => set({ busy }),
}));
