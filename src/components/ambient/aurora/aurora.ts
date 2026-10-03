import { clock, effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";
import auroraShader from "./aurora.wgsl";

export interface AuroraOptions {
  canvas: HTMLCanvasElement;
  getDark: () => boolean;
  onError?: (error: unknown) => void;
}

/**
 * Fundo "aurora": um único efeito fullscreen (vgpu) com ruído fBm da stdlib
 * (@vgpu/wgsl-std) e parallax sutil do cursor. Sem compute, sem ping-pong —
 * leve o bastante para rodar o tempo todo atrás da interface.
 */
export function startAurora(options: AuroraOptions): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;

  // cursor normalizado (0..1), com easing para o parallax não "pular"
  const target = { x: 0.5, y: 0.5 };
  const eased = { x: 0.5, y: 0.5 };
  const onMove = (e: PointerEvent) => {
    target.x = e.clientX / Math.max(1, window.innerWidth);
    target.y = e.clientY / Math.max(1, window.innerHeight);
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  void (async () => {
    try {
      gpu = await init();
      if (disposed) return gpu.dispose();

      const canvasSurface = surface(gpu, options.canvas, { dpr: [1, 1.5] });
      const fx = effect(gpu, auroraShader, {
        label: "aurora",
        set: {
          params: {
            time: 0,
            dark: options.getDark() ? 1 : 0,
            pointer: [0.5, 0.5],
            texel: canvasSurface.texelSize,
            _pad: [0, 0],
          },
        },
      });
      canvasSurface.onResize(() => fx.set({ params: { texel: canvasSurface.texelSize } }));
      await fx.compile(canvasSurface);
      if (disposed) return;

      const time = clock(gpu);
      loop = frameLoop(gpu, (frame) => {
        if (document.hidden) return;
        eased.x += (target.x - eased.x) * 0.04;
        eased.y += (target.y - eased.y) * 0.04;
        fx.set({ params: { time: time.time, dark: options.getDark() ? 1 : 0, pointer: [eased.x, eased.y] } });
        frame.pass(canvasSurface, fx);
      });
    } catch (error) {
      if (!disposed) options.onError?.(error);
    }
  })();

  return () => {
    disposed = true;
    window.removeEventListener("pointermove", onMove);
    loop?.stop();
    gpu?.dispose();
  };
}
