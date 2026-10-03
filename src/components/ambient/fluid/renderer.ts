import { surface, type Gpu, type Surface } from "vgpu";
import { installStirInput } from "./pointer-input";
import {
  createFluid,
  destroyFluid,
  prepareFluid,
  renderFluid,
  resizeFluid,
  setFluidTheme,
  stepFluid,
  type Fluid,
} from "./simulation";

const FIXED_STEP = 1 / 60;

interface RendererOptions {
  canvas: HTMLCanvasElement;
  getDark: () => boolean;
  /** Chamado se WebGPU não inicializar (para cair no fallback CSS). */
  onError?: (error: unknown) => void;
}

function fixedStepCount(accumulator: number, elapsed: number) {
  let next = accumulator + Math.min(elapsed, 1 / 30);
  let steps = 0;
  while (next >= FIXED_STEP && steps < 2) {
    next -= FIXED_STEP;
    steps++;
  }
  return { steps, accumulator: steps === 2 ? 0 : next };
}

/**
 * Fluido interativo (Navier-Stokes com projeção de pressão) adaptado do
 * exemplo "Interactive Fluid" do vgpu. Roda como fundo da aplicação.
 */
export function createFluidRenderer(options: RendererOptions) {
  let disposed = false;
  let gpu: Gpu | undefined;
  let canvasSurface: Surface | undefined;
  let fluid: Fluid | undefined;
  let input: ReturnType<typeof installStirInput> | undefined;
  let animationFrame = 0;
  let accumulator = 0;
  let previous = 0;
  let dark = options.getDark();

  const tick = (now: number) => {
    if (disposed) return;
    if (!document.hidden && fluid && input && canvasSurface) {
      const nextDark = options.getDark();
      if (nextDark !== dark) {
        dark = nextDark;
        setFluidTheme(fluid, dark, canvasSurface);
      }
      const fixed = fixedStepCount(accumulator, (now - previous) / 1000);
      accumulator = fixed.accumulator;
      for (let i = 0; i < fixed.steps; i++) stepFluid(fluid, input);
      renderFluid(fluid, canvasSurface);
    }
    previous = now;
    animationFrame = requestAnimationFrame(tick);
  };

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    input?.dispose();
    if (fluid) destroyFluid(fluid);
    gpu?.dispose();
  }

  const initialize = async () => {
    const { init } = await import("vgpu");
    if (disposed) return;
    const nextGpu = await init();
    if (disposed) {
      nextGpu.dispose();
      return;
    }
    gpu = nextGpu;
    // DPR limitado: é um fundo, não precisa de nitidez máxima.
    canvasSurface = surface(gpu, options.canvas, { dpr: [1, 1.5] });
    fluid = createFluid(gpu);
    fluid.dark = dark;
    input = installStirInput(options.canvas);
    await prepareFluid(fluid, canvasSurface);
    if (disposed) return;
    canvasSurface.onResize(() => {
      if (!disposed && fluid && canvasSurface) resizeFluid(fluid, canvasSurface);
    });
    previous = performance.now();
    animationFrame = requestAnimationFrame(tick);
  };

  const ready = initialize().catch((error: unknown) => {
    if (disposed) return;
    dispose();
    options.onError?.(error);
  });

  return { ready, dispose };
}
