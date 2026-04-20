import { hexToRgb } from "@/canvas/shaders/runtime";
import { SHADER_SOURCES, type ShaderSourceId } from "@/canvas/shaders/sources";
import { shaderPresetMap } from "@/lib/presets/shaders";

const VS = `#version 300 es
precision highp float;
out vec2 v_uv;
void main() {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 pos = positions[gl_VertexID];
  v_uv = (pos + 1.0) * 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

const PRELUDE = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
`;

function compileShader(gl: WebGL2RenderingContext, type: GLenum, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error("createShader failed");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s) ?? "unknown";
    gl.deleteShader(s);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return s;
}

/**
 * Renders the named shader preset to a fresh OffscreenCanvas and returns the
 * underlying canvas (suitable for ctx.drawImage on any 2D context, and
 * transferable to a worker or back via ImageBitmap).
 *
 * Runs in both main thread and worker contexts.
 */
export async function renderShaderToOffscreen(
  presetId: string,
  params: Record<string, string | number>,
  seed: number,
  width: number,
  height: number,
): Promise<OffscreenCanvas | null> {
  const preset = shaderPresetMap.get(presetId);
  if (!preset) return null;

  const canvas = new OffscreenCanvas(
    Math.max(1, Math.floor(width)),
    Math.max(1, Math.floor(height)),
  );
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;

  const sourceId = preset.source as ShaderSourceId;
  const fragSrc = SHADER_SOURCES[sourceId];
  const vs = compileShader(gl, gl.VERTEX_SHADER, VS);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, PRELUDE + fragSrc);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set uniforms.
  const setUniform = (name: string, value: number | [number, number, number]) => {
    const loc = gl.getUniformLocation(program, name);
    if (!loc) return;
    if (typeof value === "number") gl.uniform1f(loc, value);
    else gl.uniform3f(loc, value[0], value[1], value[2]);
  };
  setUniform("u_resolution", [canvas.width, canvas.height, 0] as [number, number, number]);
  // setUniform doesn't handle vec2 cleanly — use direct path for u_resolution:
  const resLoc = gl.getUniformLocation(program, "u_resolution");
  if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);
  setUniform("u_seed", seed);
  setUniform("u_time", 0);

  for (const spec of preset.params) {
    const value = params[spec.key] ?? preset.defaults[spec.key];
    if (spec.kind === "color") {
      const hex = typeof value === "string" ? value : spec.default;
      const rgb = hexToRgb(hex);
      setUniform(spec.key, rgb);
    } else {
      const num = typeof value === "number" ? value : spec.default;
      setUniform(spec.key, num);
    }
  }

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.deleteProgram(program);
  return canvas;
}
