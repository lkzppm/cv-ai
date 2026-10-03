import { hash2, hash1 } from "@vgpu/wgsl-std/hash";

// "Papers": documentos esboçados (currículo, perfil, gráfico, checklist, carta,
// nota) numa grade esparsa com colunas desencontradas, cada coluna derivando
// para cima numa velocidade própria (profundidade), folhas levemente giradas
// e balançando. Perto do cursor dobram o canto superior direito (dog-ear) e
// ganham mais tinta; um foco de luz suave acompanha o ponteiro.
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
fn sd_circle(p: vec2f, r: f32) -> f32 { return length(p) - r; }

// Antialiasing pelo tamanho do pixel (fwidth exige fluxo de controle uniforme).
fn fill(d: f32, aa: f32) -> f32 { return 1.0 - smoothstep(-aa, aa, d); }
fn stroke(d: f32, width: f32, aa: f32) -> f32 { return 1.0 - smoothstep(width - aa, width + aa, abs(d)); }
fn rot(p: vec2f, a: f32) -> vec2f { let c = cos(a); let s = sin(a); return vec2f(c * p.x - s * p.y, s * p.x + c * p.y); }

// barra horizontal de texto alinhada à esquerda
fn text_line(c: vec2f, x0: f32, y: f32, len: f32, th: f32, aa: f32) -> f32 {
  return fill(sd_round_box(c - vec2f(x0 + len * 0.5, y), vec2f(len * 0.5, th), th * 0.8), aa);
}

// ---- tipos de documento (retornam tinta 0..1 e marcam o "nome" em separado) ----
struct Doc { ink: f32, name: f32 }

fn doc_resume(c: vec2f, w: f32, hgt: f32, id: vec2f, aa: f32) -> Doc {
  var d = Doc(0.0, 0.0);
  let left = -w * 0.5 + 0.02;
  let top = -hgt * 0.5 + 0.026;
  d.name = text_line(c, left, top + 0.005, w * 0.40, 0.0052, aa);
  d.ink += text_line(c, left, top + 0.021, w * 0.28, 0.0028, aa) * 0.7;
  for (var i = 0; i < 5; i = i + 1) {
    let fi = f32(i);
    let lh = hash2(id * 3.1 + vec2f(fi * 1.7, fi * 0.9)).x;
    let lx = select(left, left + w * 0.06, i == 2);
    d.ink += text_line(c, lx, top + 0.046 + fi * 0.019, w * (0.5 + 0.4 * lh), 0.0025, aa) * 0.75;
  }
  return d;
}

fn doc_profile(c: vec2f, w: f32, hgt: f32, id: vec2f, aa: f32) -> Doc {
  var d = Doc(0.0, 0.0);
  let left = -w * 0.5 + 0.02;
  let top = -hgt * 0.5 + 0.026;
  // avatar + nome + cargo
  let av = sd_circle(c - vec2f(left + 0.016, top + 0.016), 0.014);
  d.ink += stroke(av, 0.0016, aa) * 0.9;
  d.ink += fill(sd_circle(c - vec2f(left + 0.016, top + 0.012), 0.005), aa) * 0.8;   // cabeça
  d.ink += fill(sd_round_box(c - vec2f(left + 0.016, top + 0.024), vec2f(0.009, 0.004), 0.004), aa) * 0.8; // ombros
  d.name = text_line(c, left + 0.04, top + 0.009, w * 0.34, 0.0048, aa);
  d.ink += text_line(c, left + 0.04, top + 0.024, w * 0.26, 0.0026, aa) * 0.7;
  // três "tags"
  for (var i = 0; i < 3; i = i + 1) {
    let fi = f32(i);
    let tw = 0.018 + 0.012 * hash2(id * 5.3 + vec2f(fi, 2.0)).x;
    let x = left + fi * 0.036;
    d.ink += stroke(sd_round_box(c - vec2f(x + tw * 0.5, top + 0.055), vec2f(tw * 0.5, 0.0055), 0.0055), 0.0014, aa) * 0.8;
  }
  for (var i = 0; i < 3; i = i + 1) {
    let fi = f32(i);
    d.ink += text_line(c, left, top + 0.078 + fi * 0.018, w * (0.55 + 0.3 * hash2(id * 2.2 + vec2f(fi, 7.0)).x), 0.0025, aa) * 0.7;
  }
  return d;
}

fn doc_chart(c: vec2f, w: f32, hgt: f32, id: vec2f, aa: f32) -> Doc {
  var d = Doc(0.0, 0.0);
  let left = -w * 0.5 + 0.02;
  let top = -hgt * 0.5 + 0.026;
  d.name = text_line(c, left, top + 0.005, w * 0.36, 0.0048, aa);
  // eixo + 5 barras com alturas aleatórias (anima devagar)
  let base_y = hgt * 0.5 - 0.03;
  d.ink += text_line(c, left, base_y, w - 0.04, 0.0012, aa) * 0.6;
  let bw = (w - 0.04) / 5.0;
  for (var i = 0; i < 5; i = i + 1) {
    let fi = f32(i);
    let r = hash2(id * 4.7 + vec2f(fi, 1.0)).x;
    let bh = (0.02 + 0.06 * r) * (0.9 + 0.1 * sin(params.time * 0.6 + fi + id.x));
    let x = left + bw * (fi + 0.5);
    d.ink += fill(sd_round_box(c - vec2f(x, base_y - bh * 0.5), vec2f(bw * 0.28, bh * 0.5), 0.003), aa) * (0.5 + 0.3 * r);
  }
  // linha de tendência
  d.ink += text_line(c, left, top + 0.024, w * 0.5, 0.0024, aa) * 0.6;
  return d;
}

fn doc_checklist(c: vec2f, w: f32, hgt: f32, id: vec2f, aa: f32) -> Doc {
  var d = Doc(0.0, 0.0);
  let left = -w * 0.5 + 0.02;
  let top = -hgt * 0.5 + 0.026;
  d.name = text_line(c, left, top + 0.005, w * 0.42, 0.0048, aa);
  for (var i = 0; i < 5; i = i + 1) {
    let fi = f32(i);
    let y = top + 0.03 + fi * 0.022;
    let bx = sd_round_box(c - vec2f(left + 0.007, y), vec2f(0.0065), 0.0018);
    let done = hash2(id * 6.1 + vec2f(fi, 3.0)).x > 0.45;
    d.ink += stroke(bx, 0.0014, aa) * 0.85;
    if (done) {
      // "check": dois segmentos
      let q = c - vec2f(left + 0.007, y);
      let s1 = sd_round_box(rot(q - vec2f(-0.0025, 0.001), 0.785), vec2f(0.0032, 0.0011), 0.001);
      let s2 = sd_round_box(rot(q - vec2f(0.0018, -0.0008), -0.785), vec2f(0.0045, 0.0011), 0.001);
      d.ink += (fill(s1, aa) + fill(s2, aa)) * 0.9;
    }
    d.ink += text_line(c, left + 0.022, y, w * (0.45 + 0.35 * hash2(id * 1.9 + vec2f(fi, 9.0)).x), 0.0025, aa) * 0.75;
  }
  return d;
}

fn doc_letter(c: vec2f, w: f32, hgt: f32, id: vec2f, aa: f32) -> Doc {
  var d = Doc(0.0, 0.0);
  let left = -w * 0.5 + 0.02;
  let top = -hgt * 0.5 + 0.026;
  d.ink += text_line(c, left, top + 0.004, w * 0.22, 0.0028, aa) * 0.7;        // data
  d.name = text_line(c, left, top + 0.024, w * 0.5, 0.0046, aa);              // "Prezado(a)"
  for (var i = 0; i < 7; i = i + 1) {
    let fi = f32(i);
    let last = i == 6;
    let len = select(w - 0.04, w * 0.45, last);
    d.ink += text_line(c, left, top + 0.044 + fi * 0.016, len, 0.0023, aa) * 0.7;
  }
  return d;
}

fn doc_note(c: vec2f, w: f32, hgt: f32, id: vec2f, aa: f32) -> Doc {
  var d = Doc(0.0, 0.0);
  let left = -w * 0.5 + 0.02;
  let top = -hgt * 0.5 + 0.026;
  // selo de nota (anel) + número sugerido + 2 linhas
  let ring = sd_circle(c - vec2f(0.0, top + 0.03), 0.02);
  d.ink += stroke(ring, 0.0022, aa) * 0.9;
  d.name = text_line(c, -0.008, top + 0.03, 0.016, 0.0045, aa);
  d.ink += text_line(c, left, top + 0.068, w * 0.7, 0.0026, aa) * 0.7;
  d.ink += text_line(c, left, top + 0.085, w * 0.5, 0.0026, aa) * 0.7;
  return d;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.texel.y / params.texel.x;
  let base_dark  = vec3f(0.039, 0.070, 0.125);  // #0A1220
  let base_light = vec3f(0.953, 0.965, 0.985);  // #F3F6FB
  let base = mix(base_light, base_dark, params.dark);
  let aa = params.texel.y * 0.9;

  // parallax de ~1% contra o cursor
  let shift = (params.pointer - vec2f(0.5)) * vec2f(-0.012 * aspect, 0.012);
  var p = vec2f(uv.x * aspect, uv.y) + shift;

  // grade esparsa; cada coluna sobe numa velocidade própria (sensação de profundidade)
  let cell = vec2f(0.34, 0.42);
  let column = floor(p.x / cell.x);
  let speed = 0.004 + 0.006 * hash1(column * 1.37 + 0.5);
  p.y += params.time * speed + column * cell.y * 0.5;
  let id = vec2f(column, floor(p.y / cell.y));
  let local = (fract(p / cell) - 0.5) * cell;

  let h = hash2(id * 7.31 + vec2f(3.7, 1.3));
  let h2 = hash2(id * 13.7 + vec2f(9.1, 4.2));
  let h3 = hash2(id * 2.9 + vec2f(0.4, 6.6));

  var ink = 0.0;
  var ink_name = 0.0;
  var near = 0.0;
  if (h.x > 0.14) {
    // folha: tamanho, jitter, inclinação e balanço
    let w = 0.11 + 0.065 * h.y;
    let hgt = w * 1.32;
    let jitter = vec2f((h2.x - 0.5) * 0.09, (h2.y - 0.5) * 0.10);
    let bob = vec2f(sin(params.time * 0.18 + h.x * 6.2832) * 0.004, sin(params.time * 0.27 + h.y * 6.2832) * 0.006);
    let tilt = (h3.x - 0.5) * 0.22 + sin(params.time * 0.2 + h3.y * 6.2832) * 0.03;
    let c = rot(local - jitter - bob, tilt);

    // centro da folha de volta ao espaço da tela (desfaz deriva, desencontro e parallax)
    let center_p = (id + 0.5) * cell + jitter + bob;
    let center_uv = vec2f(
      (center_p.x - shift.x) / aspect,
      center_p.y - params.time * speed - column * cell.y * 0.5 - shift.y,
    );
    let dcur = length((center_uv - params.pointer) * vec2f(aspect, 1.0));
    near = smoothstep(0.40, 0.06, dcur);

    // dobra do canto superior direito
    let breathe = 0.5 + 0.5 * sin(params.time * 0.45 + h.y * 6.2832);
    let k = w * (0.05 + 0.04 * breathe + 0.40 * near);
    let a = w * 0.5 - c.x;
    let b = c.y + hgt * 0.5;
    let s_ab = a + b;
    let cut = smoothstep(k - aa, k + aa, s_ab);
    let in_corner_box = step(0.0, a) * step(0.0, b) * step(a, k) * step(b, k);
    let flap = in_corner_box * (1.0 - cut);
    let fold = in_corner_box * cut * (1.0 - smoothstep(2.0 * k - aa, 2.0 * k + aa, s_ab));
    let keep = 1.0 - flap;

    let d_card = sd_round_box(c, vec2f(w, hgt) * 0.5, 0.01);
    ink += stroke(d_card, 0.0017, aa) * 0.9 * keep;
    ink += fill(d_card, aa) * 0.12 * keep;
    let d_fold_line = abs(s_ab - k) * 0.7071;
    ink += fold * 0.34;
    ink += stroke(d_fold_line, 0.0015, aa) * in_corner_box * 0.9;
    ink += fill(d_card, aa) * in_corner_box * cut * (1.0 - smoothstep(2.0 * k, 2.6 * k, s_ab)) * 0.10;

    // tipo de documento
    let kind = i32(floor(h3.y * 6.0));
    var doc = Doc(0.0, 0.0);
    if (kind == 0) { doc = doc_resume(c, w, hgt, id, aa); }
    else if (kind == 1) { doc = doc_profile(c, w, hgt, id, aa); }
    else if (kind == 2) { doc = doc_chart(c, w, hgt, id, aa); }
    else if (kind == 3) { doc = doc_checklist(c, w, hgt, id, aa); }
    else if (kind == 4) { doc = doc_letter(c, w, hgt, id, aa); }
    else { doc = doc_note(c, w, hgt, id, aa); }

    let inside = fill(d_card, aa) * keep * (1.0 - fold);
    ink += doc.ink * inside;
    ink_name += doc.name * inside;
  }
  ink = clamp(ink, 0.0, 1.0);
  ink_name = clamp(ink_name, 0.0, 1.0);

  let ink_dark = vec3f(0.62, 0.80, 1.00);
  let ink_light = vec3f(0.12, 0.44, 0.92);
  let ink_col = mix(ink_light, ink_dark, params.dark);
  let alpha = mix(0.075, 0.085, params.dark);

  let presence = 1.0 + 0.9 * near;
  var col = base;
  col = mix(col, ink_col, (ink * alpha + ink_name * alpha * 1.6) * presence);

  let pv = (uv - params.pointer) * vec2f(aspect, 1.0);
  let spot = exp(-dot(pv, pv) * 7.0);
  let top_glow = exp(-pow((uv.y - 0.05) * 2.4, 2.0));
  let glow_col = mix(vec3f(0.12, 0.44, 0.92), vec3f(0.30, 0.55, 1.00), params.dark);
  col += glow_col * (spot * mix(0.035, 0.07, params.dark) + top_glow * mix(0.02, 0.05, params.dark));

  let vig = smoothstep(1.35, 0.5, length((uv - vec2f(0.5)) * vec2f(aspect, 1.0)));
  col = mix(base, col, 0.6 + 0.4 * vig);

  return vec4f(col, 1.0);
}
