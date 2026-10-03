import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";

// Aurora lenta: campo de ruído fBm deformado (domain warp) que modula três
// tons de azul. Contraste baixo de propósito — é um fundo, não um show.
struct Params {
  time: f32,
  dark: f32,
  pointer: vec2f,   // 0..1, suavizado no TS (parallax sutil)
  texel: vec2f,     // 1 / resolução
  _pad: vec2f,
}
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.texel.y / params.texel.x;
  // parallax: o campo desliza ~1.5% na direção oposta ao cursor
  let shift = (params.pointer - vec2f(0.5)) * vec2f(-0.015, 0.015);
  let p = vec2f((uv.x + shift.x) * aspect, uv.y + shift.y);
  let t = params.time * 0.035;

  // domain warp em duas etapas, bem lento
  let q = vec2f(
    fbmSimplex2d(p * 1.2 + vec2f(0.0, t), 3, 2.0, 0.5),
    fbmSimplex2d(p * 1.2 + vec2f(5.2, 1.3) - vec2f(t * 0.7, 0.0), 3, 2.0, 0.5),
  );
  let r = vec2f(
    fbmSimplex2d(p * 0.9 + 1.6 * q + vec2f(1.7, 9.2) + vec2f(t * 0.4), 3, 2.0, 0.5),
    fbmSimplex2d(p * 0.9 + 1.6 * q + vec2f(8.3, 2.8) - vec2f(0.0, t * 0.5), 3, 2.0, 0.5),
  );
  let n = fbmSimplex2d(p * 0.8 + 1.4 * r, 4, 2.0, 0.5) * 0.5 + 0.5; // 0..1

  // Paleta azul
  let base_dark  = vec3f(0.035, 0.055, 0.095);  // #0A1220 navy
  let base_light = vec3f(0.953, 0.965, 0.985);  // #F3F6FB
  let blue       = vec3f(0.298, 0.553, 1.000);  // #4C8DFF
  let sky        = vec3f(0.620, 0.800, 1.000);  // #9ECCFF
  let teal       = vec3f(0.330, 0.800, 0.870);  // #54CCDE

  let base = mix(base_light, base_dark, params.dark);
  // três bandas suaves ao longo do ruído
  let band1 = smoothstep(0.30, 0.62, n) * (1.0 - smoothstep(0.62, 0.92, n));
  let band2 = smoothstep(0.55, 0.85, n);
  let band3 = smoothstep(0.05, 0.35, n) * (1.0 - smoothstep(0.35, 0.60, n));

  // intensidade menor no claro para manter o papel limpo
  let k = mix(0.22, 0.42, params.dark);
  var col = base;
  col = mix(col, blue, band1 * k);
  col = mix(col, teal, band2 * k * 0.55);
  col = mix(col, sky,  band3 * k * 0.45);

  // brilho suave de topo e vinheta discreta
  let glow = exp(-pow((uv.y - 0.08) * 2.2, 2.0)) * 0.08 * params.dark;
  col += blue * glow;
  let vig = smoothstep(1.5, 0.45, length((uv - vec2f(0.5)) * vec2f(aspect, 1.0)));
  col = mix(base, col, 0.55 + 0.45 * vig);

  return vec4f(col, 1.0);
}
