import { index_of } from "./fluid-common.wgsl";

struct DisplayConfig {
  output_size: vec2f,
  dark: f32,
  _pad: f32,
}
const DYE_SIZE = vec2u(512, 288);
@group(0) @binding(0) var<uniform> config: DisplayConfig;
@group(0) @binding(1) var<storage, read> dye: array<vec4f>;

fn sample_dye(p: vec2f) -> vec3f {
  let grid = clamp(p * vec2f(DYE_SIZE) - 0.5, vec2f(0), vec2f(DYE_SIZE) - 1.0);
  let cell = vec2i(floor(grid));
  let f = fract(grid);
  let bottom = mix(dye[index_of(cell, DYE_SIZE)].rgb, dye[index_of(cell + vec2i(1, 0), DYE_SIZE)].rgb, f.x);
  let top = mix(dye[index_of(cell + vec2i(0, 1), DYE_SIZE)].rgb, dye[index_of(cell + vec2i(1, 1), DYE_SIZE)].rgb, f.x);
  return mix(bottom, top, f.y);
}

@fragment
fn fragment_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  var uv = position.xy / config.output_size;
  uv.y = 1.0 - uv.y; // WebGPU fragment coordinates start at the top; the solver's +Y points up.
  let density = sample_dye(uv);
  let ink = 1.0 - exp(-density * 1.35);
  let vignette = 0.70 + 0.30 * pow(max(0.0, 1.0 - dot(uv - 0.5, uv - 0.5) * 1.9), 1.5);

  // Tema escuro: tinta aditiva sobre quase-preto violeta.
  let dark_base = vec3f(0.028, 0.024, 0.048);
  let dark_out = (dark_base + ink * 0.85) * vignette;

  // Tema claro: pastel — escurece levemente o papel e soma a tinta.
  let light_base = vec3f(0.965, 0.960, 0.985);
  let strength = max(ink.r, max(ink.g, ink.b));
  let light_out = light_base * (1.0 - 0.55 * strength) + ink * 0.50;

  return vec4f(mix(light_out, dark_out, config.dark), 1.0);
}
