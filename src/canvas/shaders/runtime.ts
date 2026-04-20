/**
 * Minimal WebGL2 shader runner. Compiles a fragment shader that covers a full-screen
 * quad, sets uniforms, renders once into an HTMLCanvasElement, and returns the canvas
 * (which can be used directly as a Konva Image source or exported).
 *
 * Keep this file zero-dependency — it runs on the main thread today and will run
 * inside a Worker in the export pipeline later.
 */

const VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 v_uv;
void main() {
  // Full-screen triangle trick: 3 vertices cover the clip-space square.
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

export type ShaderUniforms = Record<
  string,
  number | [number, number] | [number, number, number] | [number, number, number, number]
>;

export type CompiledShader = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniformLocs: Map<string, WebGLUniformLocation | null>;
  destroy: () => void;
};

export function createShaderCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown";
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}\n\nSource:\n${source}`);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown";
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

export function compile(fragSource: string, width: number, height: number): CompiledShader {
  const canvas = createShaderCanvas(width, height);
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL2 not supported");

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, PRELUDE + fragSource);
  const program = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return {
    canvas,
    gl,
    program,
    uniformLocs: new Map(),
    destroy: () => {
      gl.deleteProgram(program);
      const loseExt = gl.getExtension("WEBGL_lose_context");
      loseExt?.loseContext();
    },
  };
}

function uniformLoc(shader: CompiledShader, name: string): WebGLUniformLocation | null {
  const cached = shader.uniformLocs.get(name);
  if (cached !== undefined) return cached;
  const loc = shader.gl.getUniformLocation(shader.program, name);
  shader.uniformLocs.set(name, loc);
  return loc;
}

export function setUniforms(shader: CompiledShader, uniforms: ShaderUniforms): void {
  const { gl } = shader;
  gl.useProgram(shader.program);
  for (const [name, value] of Object.entries(uniforms)) {
    const loc = uniformLoc(shader, name);
    if (!loc) continue;
    if (typeof value === "number") {
      gl.uniform1f(loc, value);
    } else if (value.length === 2) {
      gl.uniform2f(loc, value[0], value[1]);
    } else if (value.length === 3) {
      gl.uniform3f(loc, value[0], value[1], value[2]);
    } else if (value.length === 4) {
      gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
    }
  }
}

export function render(
  shader: CompiledShader,
  uniforms: ShaderUniforms,
  resizeTo?: { width: number; height: number },
): HTMLCanvasElement {
  const { gl, canvas } = shader;
  if (resizeTo && (canvas.width !== resizeTo.width || canvas.height !== resizeTo.height)) {
    canvas.width = resizeTo.width;
    canvas.height = resizeTo.height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(shader.program);
  setUniforms(shader, {
    ...uniforms,
    u_resolution: [canvas.width, canvas.height],
  });
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return canvas;
}

export function renderOnce(
  fragSource: string,
  width: number,
  height: number,
  uniforms: ShaderUniforms,
): HTMLCanvasElement {
  const shader = compile(fragSource, width, height);
  try {
    const result = render(shader, uniforms);
    const out = document.createElement("canvas");
    out.width = result.width;
    out.height = result.height;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(result, 0, 0);
    return out;
  } finally {
    shader.destroy();
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = Number.parseInt(n.slice(0, 2), 16) / 255;
  const g = Number.parseInt(n.slice(2, 4), 16) / 255;
  const b = Number.parseInt(n.slice(4, 6), 16) / 255;
  return [Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0];
}
