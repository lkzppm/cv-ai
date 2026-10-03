import { hash2 } from "@vgpu/wgsl-std/hash";

// "Papers": folhas de currículo esboçadas (contorno + linhas de texto) em uma
// grade esparsa, derivando para cima bem devagar, com um foco de luz suave
// perto do cursor. Opacidade baixa: é textura de fundo, não atração.
struct Params {
  time: f32,
  dark: f32,
  pointer: vec2f,   // 0..1 (top-origin), suavizado no TS
  texel: vec2f,     // 1 / resolução
  _pad: vec2f,
}
@group(0) @binding(0) var<uniform> params: Params;

fn sd_round_box(p: vec2f, half_size: vec2f, radius: f32) -> f32 {
  let q = abs(p) - half_size + vec2f(radius);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

// 1 dentro, 0 fora. O antialiasing usa o tamanho do pixel (texel) em vez de
// fwidth(): fwidth exige fluxo de controle uniforme e aqui o desenho está
// dentro de um `if` por célula.
fn fill(d: f32, aa: f32) -> f32 {
  return 1.0 - smoothstep(-aa, aa, d);
}
fn stroke(d: f32, width: f32, aa: f32) -> f32 {
  return 1.0 - smoothstep(width - aa, width + aa, abs(d));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.texel.y / params.texel.x;
  let base_dark  = vec3f(0.039, 0.070, 0.125);  // #0A1220
  let base_light = vec3f(0.953, 0.965, 0.985);  // #F3F6FB
  let base = mix(base_light, base_dark, params.dark);
  let aa = params.texel.y * 0.9; // ~1 pixel em unidades uv (eixo y não é escalado)

  // parallax de ~1% contra o cursor
  let shift = (params.pointer - vec2f(0.5)) * vec2f(-0.012 * aspect, 0.012);
  var p = vec2f(uv.x * aspect, uv.y) + shift;

  // deriva lenta para cima (as folhas "sobem")
  p.y += params.time * 0.006;

  // grade esparsa com colunas desencontradas
  let cell = vec2f(0.46, 0.56);
  let column = floor(p.x / cell.x);
  p.y += column * cell.y * 0.5;
  let id = vec2f(column, floor(p.y / cell.y));
  let local = (fract(p / cell) - 0.5) * cell;

  let h = hash2(id * 7.31 + vec2f(3.7, 1.3));
  let h2 = hash2(id * 13.7 + vec2f(9.1, 4.2));

  var ink = 0.0;        // intensidade acumulada do desenho (0..1)
  var ink_name = 0.0;   // a linha do "nome" ganha um pouco mais de peso
  if (h.x > 0.28) {
    // folha: largura e proporção A4 aproximada, com jitter e balanço sutil
    let w = 0.15 + 0.05 * h.y;
    let hgt = w * 1.35;
    let jitter = vec2f((h2.x - 0.5) * 0.10, (h2.y - 0.5) * 0.12);
    let bob = vec2f(0.0, sin(params.time * 0.25 + h.x * 6.2832) * 0.005);
    let c = local - jitter - bob;

    let d_card = sd_round_box(c, vec2f(w, hgt) * 0.5, 0.012);
    ink += stroke(d_card, 0.0018, aa) * 0.9;
    ink += fill(d_card, aa) * 0.12;

    // conteúdo: "nome" (barra curta e mais grossa) + 5 linhas de texto
    let left = -w * 0.5 + 0.022;
    let top = -hgt * 0.5 + 0.03;
    let name = sd_round_box(c - vec2f(left + w * 0.19, top + 0.006), vec2f(w * 0.19, 0.0055), 0.0045);
    ink_name += fill(name, aa);
    let sub = sd_round_box(c - vec2f(left + w * 0.13, top + 0.024), vec2f(w * 0.13, 0.003), 0.0025);
    ink += fill(sub, aa) * 0.7;

    for (var i = 0; i < 5; i = i + 1) {
      let fi = f32(i);
      let lh = hash2(id * 3.1 + vec2f(fi * 1.7, fi * 0.9)).x;
      let lw = w * (0.52 + 0.38 * lh);
      let y = top + 0.052 + fi * 0.021;
      // a 3ª linha vira uma "seção" (mais curta e deslocada) para quebrar a monotonia
      let lx = select(left, left + w * 0.06, i == 2);
      let d_line = sd_round_box(c - vec2f(lx + lw * 0.5, y), vec2f(lw * 0.5, 0.0026), 0.002);
      ink += fill(d_line, aa) * 0.75;
    }
  }
  ink = clamp(ink, 0.0, 1.0);
  ink_name = clamp(ink_name, 0.0, 1.0);

  // cor da tinta e opacidade por tema (bem baixas)
  let ink_dark = vec3f(0.62, 0.80, 1.00);   // #9ECCFF
  let ink_light = vec3f(0.12, 0.44, 0.92);  // #1F6FEB
  let ink_col = mix(ink_light, ink_dark, params.dark);
  let alpha = mix(0.075, 0.085, params.dark);

  var col = base;
  col = mix(col, ink_col, ink * alpha + ink_name * alpha * 1.6);

  // foco de luz suave acompanhando o cursor + leve brilho no topo
  let pv = (uv - params.pointer) * vec2f(aspect, 1.0);
  let spot = exp(-dot(pv, pv) * 7.0);
  let top_glow = exp(-pow((uv.y - 0.05) * 2.4, 2.0));
  let glow_col = mix(vec3f(0.12, 0.44, 0.92), vec3f(0.30, 0.55, 1.00), params.dark);
  col += glow_col * (spot * mix(0.035, 0.07, params.dark) + top_glow * mix(0.02, 0.05, params.dark));

  // esmaece as folhas perto das bordas para não disputar com os painéis
  let vig = smoothstep(1.35, 0.5, length((uv - vec2f(0.5)) * vec2f(aspect, 1.0)));
  col = mix(base, col, 0.6 + 0.4 * vig);

  return vec4f(col, 1.0);
}
