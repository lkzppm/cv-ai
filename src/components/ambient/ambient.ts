import { clock, effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

/**
 * Fundo ambiente em WebGPU (vgpu): três "blobs" nos azuis do LinkedIn que
 * derivam lentamente. Shader fullscreen; uniforms endereçados por nome.
 */
const AMBIENT_WGSL = /* wgsl */ `
struct Params { time: f32, dark: f32, texel: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.texel.y / params.texel.x;
  let p = vec2f(uv.x * aspect, uv.y);
  let t = params.time * 0.12;

  let c1 = vec2f(0.30 * aspect + 0.22 * sin(t * 1.1), 0.42 + 0.20 * cos(t * 0.9));
  let c2 = vec2f(0.72 * aspect + 0.25 * cos(t * 0.7), 0.62 + 0.22 * sin(t * 1.3));
  let c3 = vec2f(0.50 * aspect + 0.30 * sin(t * 0.5), 0.18 + 0.25 * cos(t * 0.6));

  let d1 = exp(-5.5 * dot(p - c1, p - c1));
  let d2 = exp(-4.5 * dot(p - c2, p - c2));
  let d3 = exp(-6.5 * dot(p - c3, p - c3));

  // Paleta LinkedIn
  let sky  = vec3f(0.439, 0.710, 0.976); // #70B5F9
  let blue = vec3f(0.039, 0.400, 0.761); // #0A66C2
  let navy = vec3f(0.000, 0.255, 0.510); // #004182

  let baseLight = vec3f(0.953, 0.965, 0.980); // #F3F6FA
  let baseDark  = vec3f(0.039, 0.090, 0.149); // #0A1726
  let base = mix(baseLight, baseDark, params.dark);

  var col = base;
  col = mix(col, sky,  d1 * mix(0.55, 0.28, params.dark));
  col = mix(col, blue, d2 * mix(0.38, 0.30, params.dark));
  col = mix(col, navy, d3 * mix(0.18, 0.35, params.dark));

  // leve vinheta para o conteúdo "assentar"
  let v = smoothstep(1.35, 0.35, length(uv - vec2f(0.5)));
  col = mix(base, col, v);
  return vec4f(col, 1.0);
}
`;

export function startAmbient(canvas: HTMLCanvasElement, getDark: () => boolean): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;

  void (async () => {
    try {
      gpu = await init();
    } catch (err) {
      console.warn("[ambient] WebGPU indisponível, usando fallback CSS", err);
      canvas.dataset.fallback = "1";
      return;
    }
    if (disposed) return gpu.dispose();

    const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5] });
    const fx = effect(gpu, AMBIENT_WGSL, {
      label: "ambient-linkedin",
      set: { params: { time: 0, dark: getDark() ? 1 : 0, texel: canvasSurface.texelSize } },
    });
    canvasSurface.onResize(() => fx.set({ params: { texel: canvasSurface.texelSize } }));

    const time = clock(gpu);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    loop = frameLoop(gpu, (frame) => {
      fx.set({ params: { time: reduced ? 0 : time.time, dark: getDark() ? 1 : 0 } });
      frame.pass(canvasSurface, fx);
    });
  })();

  return () => {
    disposed = true;
    loop?.stop();
    gpu?.dispose();
  };
}
