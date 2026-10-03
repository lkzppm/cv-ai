"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

/**
 * Fundo da aplicação: folhas de currículo esboçadas (WebGPU via vgpu) que
 * derivam devagar, com parallax e foco de luz no cursor. Sem WebGPU (ou se a
 * inicialização falhar), cai para um padrão CSS estático com a mesma ideia.
 */
export function AmbientCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hasWebGpu = useSyncExternalStore(
    () => () => {},
    () => "gpu" in navigator,
    () => true,
  );
  const [initFailed, setInitFailed] = useState(false);
  const themeRef = useRef(useSessions.getState().theme);
  const fallback = !hasWebGpu || initFailed;

  useEffect(() => useSessions.subscribe((s) => void (themeRef.current = s.theme)), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !hasWebGpu) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import("./papers/papers").then(({ startPapers }) => {
      if (cancelled) return;
      dispose = startPapers({
        canvas,
        getDark: () => themeRef.current === "dark",
        onError: (err) => {
          console.warn("[ambient] WebGPU falhou, usando fallback CSS", err);
          setInitFailed(true);
        },
      });
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [hasWebGpu]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {fallback ? (
        <div className="ambient-fallback absolute inset-[-10%]" />
      ) : (
        <canvas ref={ref} className="block h-full w-full" />
      )}
      {/* grão sutil por cima para dar textura */}
      <div className="grain absolute inset-0 opacity-[0.04] mix-blend-overlay" />
    </div>
  );
}
