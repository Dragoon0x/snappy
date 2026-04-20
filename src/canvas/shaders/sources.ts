/**
 * GLSL 300 es fragment shaders. The shared PRELUDE in runtime.ts declares:
 *   in vec2 v_uv; out vec4 fragColor;
 *   uniform vec2 u_resolution; uniform float u_time; uniform float u_seed;
 *
 * Each shader below adds its own uniforms on top. Keep shaders self-contained and fast —
 * they render once per param change on the main thread.
 */

export const MESH_GRADIENT = /* glsl */ `
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform float u_blend;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 mixMesh(vec2 uv) {
  // Soft 4-corner gradient with smooth blending; u_blend skews toward diagonal flow.
  float tx = smoothstep(0.0, 1.0, uv.x);
  float ty = smoothstep(0.0, 1.0, uv.y);
  vec3 top = mix(u_c1, u_c2, tx);
  vec3 bot = mix(u_c3, u_c4, tx);
  vec3 base = mix(top, bot, ty);

  // Diagonal bands: perturbation to break linearity.
  float diag = (uv.x + uv.y) * 0.5;
  vec3 accent = mix(u_c2, u_c3, smoothstep(0.2, 0.8, diag));
  return mix(base, accent, u_blend * 0.35);
}

void main() {
  vec3 col = mixMesh(v_uv);
  // Subtle film grain to avoid banding on gradients.
  float grain = (hash(gl_FragCoord.xy + u_seed) - 0.5) * 0.012;
  col += grain;
  fragColor = vec4(col, 1.0);
}
`;

export const AURORA = /* glsl */ `
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform float u_intensity;
uniform float u_warp;

// hash + 2d value noise
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03; a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv;
  vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0);

  float t = u_seed * 0.1;
  vec2 q = p + vec2(fbm(p * 2.5 + t), fbm(p * 2.3 - t * 0.7)) * u_warp;
  float f = fbm(q * 2.0);
  float band = smoothstep(0.2, 0.9, f);

  // Vertical ribbon shaping — aurora ribbons across the canvas.
  float ribbon = smoothstep(0.0, 0.5, sin((uv.y + f * 0.6) * 3.14159) * 0.5 + 0.5);

  vec3 base = mix(u_c1, u_c2, uv.y);
  vec3 glow = mix(u_c2, u_c3, band);
  vec3 col = mix(base, glow, ribbon * u_intensity);

  // Subtle vignette + grain
  float v = smoothstep(1.1, 0.4, length(uv - 0.5));
  col *= mix(0.85, 1.0, v);
  col += (hash21(gl_FragCoord.xy + u_seed) - 0.5) * 0.01;
  fragColor = vec4(col, 1.0);
}
`;

export const DOT_GRID = /* glsl */ `
uniform vec3 u_bg;
uniform vec3 u_dot;
uniform float u_spacing;
uniform float u_dotSize;
uniform float u_fade;

void main() {
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = uv * aspect * u_spacing;
  vec2 g = fract(p) - 0.5;
  float d = length(g);
  float dot = 1.0 - smoothstep(u_dotSize - 0.03, u_dotSize, d);
  // Radial fade from center for depth.
  float depth = smoothstep(0.9, 0.2, length(uv - 0.5));
  vec3 col = mix(u_bg, u_dot, dot * mix(1.0, depth, u_fade));
  fragColor = vec4(col, 1.0);
}
`;

export const WAVES = /* glsl */ `
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform float u_amp;
uniform float u_freq;

void main() {
  vec2 uv = v_uv;
  float w = sin(uv.x * u_freq * 6.28318 + u_seed) * 0.5 + 0.5;
  float w2 = sin(uv.x * u_freq * 4.2 + u_seed * 1.7) * 0.5 + 0.5;
  float mask = smoothstep(w * u_amp + 0.2, w * u_amp + 0.45, uv.y);
  float mask2 = smoothstep(w2 * u_amp * 0.7 + 0.55, w2 * u_amp * 0.7 + 0.8, uv.y);
  vec3 col = mix(u_c1, u_c2, uv.y);
  col = mix(col, u_c2 * 1.2, mask * 0.4);
  col = mix(col, u_c1 * 0.85, mask2 * 0.4);
  fragColor = vec4(col, 1.0);
}
`;

export const TOPO = /* glsl */ `
uniform vec3 u_bg;
uniform vec3 u_line;
uniform float u_density;
uniform float u_thickness;

float hash21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash21(i); float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)); float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) { float v=0.0; float a=0.5; for (int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5;} return v; }

void main() {
  vec2 uv = v_uv * u_density;
  float f = fbm(uv + u_seed * 0.31);
  float lines = abs(fract(f * 12.0 + 0.5) - 0.5);
  float l = smoothstep(u_thickness, u_thickness - 0.02, lines);
  vec3 col = mix(u_bg, u_line, l * 0.55);
  fragColor = vec4(col, 1.0);
}
`;

export const SHADER_SOURCES = {
  "mesh-gradient": MESH_GRADIENT,
  aurora: AURORA,
  "dot-grid": DOT_GRID,
  waves: WAVES,
  topo: TOPO,
} as const;

export type ShaderSourceId = keyof typeof SHADER_SOURCES;
