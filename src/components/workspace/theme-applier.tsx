"use client";

import { useEffect } from "react";
import { useSessions } from "@/lib/store/sessions";

/** Aplica a classe `.dark` no <html> conforme o tema salvo na store. */
export function ThemeApplier() {
  const theme = useSessions((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}
