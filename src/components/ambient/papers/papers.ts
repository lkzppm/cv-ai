import { clock, effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";
import papersShader from "./papers.wgsl";

export interface PapersOptions {
  canvas: HTMLCanvasElement;
  getDark: () => boolean;
  onError?: (error: unknown) => void;
}

/**
 * Fundo "papers": folhas de currículo esboçadas derivando devagar, com foco
 * de luz no cursor. Um único efeito fullscreen (vgpu), sem compute.
 */
export function startPapers(options: PapersOptions): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;

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

      const canvasSurface = surface(gpu, options.canvas, { dpr: [1, 2] });
      const fx = effect(gpu, papersShader, {
        label: "papers",
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
      // Surfaces só existem dentro de frame(); pré-compila pelo formato da surface.
      await fx.compile({ colors: [canvasSurface.format] });
      if (disposed) return;

      const time = clock(gpu);
      loop = frameLoop(gpu, (frame) => {
        if (document.hidden) return;
        eased.x += (target.x - eased.x) * 0.05;
        eased.y += (target.y - eased.y) * 0.05;
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
