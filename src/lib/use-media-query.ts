"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `matchMedia` reativo. No servidor (e na hidratação) devolve `false`, então
 * escreva a query para o caso "tela pequena": o layout de desktop é o padrão.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Mesmos cortes do Tailwind (`md` = 48rem, `lg` = 64rem). */
export const BELOW_MD = "(width < 48rem)";
export const BELOW_LG = "(width < 64rem)";
