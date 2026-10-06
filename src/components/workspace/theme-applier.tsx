"use client";

import { useEffect } from "react";
import { useSessions } from "@/lib/store/sessions";
import { applyTheme } from "@/lib/theme";

/**
 * Aplica no <html> o tema salvo na store (carga inicial e reidratação). A troca
 * pelo botão já aplica na hora, dentro da transição animada (`lib/theme.ts`).
 */
export function ThemeApplier() {
  const theme = useSessions((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}
