"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

/**
 * Fundo animado. Usa WebGPU via vgpu quando disponível; caso contrário cai
 * para um gradiente CSS animado (mesma paleta).
 */
export function AmbientCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // No servidor assumimos WebGPU (renderiza o canvas); no cliente checamos navigator.gpu.
  const hasWebGpu = useSyncExternalStore(
    () => () => {},
    () => "gpu" in navigator,
    () => true,
  );
  const [initFailed, setInitFailed] = useState(false);
  const fallback = !hasWebGpu || initFailed;
  const themeRef = useRef(useSessions.getState().theme);

  useEffect(() => useSessions.subscribe((s) => void (themeRef.current = s.theme)), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !hasWebGpu) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    // import dinâmico: vgpu só existe no browser
    import("./ambient").then(({ startAmbient }) => {
      if (cancelled) return;
      stop = startAmbient(canvas, () => themeRef.current === "dark");
      const obs = new MutationObserver(() => {
        if (canvas.dataset.fallback) setInitFailed(true);
      });
      obs.observe(canvas, { attributes: true, attributeFilter: ["data-fallback"] });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [hasWebGpu]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {fallback ? (
        <div className="ambient-fallback absolute inset-[-10%]" />
      ) : (
        <canvas ref={ref} className="block h-full w-full" />
      )}
    </div>
  );
}
