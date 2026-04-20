import type { ShaderSourceId } from "@/canvas/shaders/sources";

export type ShaderParamSpec =
  | {
      key: string;
      kind: "color";
      label: string;
      default: string;
    }
  | {
      key: string;
      kind: "number";
      label: string;
      default: number;
      min: number;
      max: number;
      step?: number;
    };

export type ShaderPreset = {
  id: string;
  name: string;
  source: ShaderSourceId;
  params: ShaderParamSpec[];
  defaults: Record<string, string | number>;
  preview: string; // CSS gradient for preview swatch
};

export const shaderPresets: ShaderPreset[] = [
  {
    id: "mesh-sunset",
    name: "Sunset mesh",
    source: "mesh-gradient",
    preview: "conic-gradient(from 225deg, #ff6a88, #feb47b, #8f94fb, #ff6a88)",
    params: [
      { key: "u_c1", kind: "color", label: "Top left", default: "#ff6a88" },
      { key: "u_c2", kind: "color", label: "Top right", default: "#feb47b" },
      { key: "u_c3", kind: "color", label: "Bottom left", default: "#8f94fb" },
      { key: "u_c4", kind: "color", label: "Bottom right", default: "#43e97b" },
      { key: "u_blend", kind: "number", label: "Blend", default: 0.6, min: 0, max: 1, step: 0.01 },
    ],
    defaults: {
      u_c1: "#ff6a88",
      u_c2: "#feb47b",
      u_c3: "#8f94fb",
      u_c4: "#43e97b",
      u_blend: 0.6,
    },
  },
  {
    id: "aurora-night",
    name: "Aurora night",
    source: "aurora",
    preview: "linear-gradient(135deg, #0b1e3f, #2d6d9e, #5df2c2)",
    params: [
      { key: "u_c1", kind: "color", label: "Sky", default: "#0b1e3f" },
      { key: "u_c2", kind: "color", label: "Wash", default: "#2d6d9e" },
      { key: "u_c3", kind: "color", label: "Glow", default: "#5df2c2" },
      {
        key: "u_intensity",
        kind: "number",
        label: "Intensity",
        default: 1.1,
        min: 0,
        max: 2,
        step: 0.01,
      },
      { key: "u_warp", kind: "number", label: "Warp", default: 0.8, min: 0, max: 2, step: 0.01 },
    ],
    defaults: {
      u_c1: "#0b1e3f",
      u_c2: "#2d6d9e",
      u_c3: "#5df2c2",
      u_intensity: 1.1,
      u_warp: 0.8,
    },
  },
  {
    id: "aurora-cosmic",
    name: "Cosmic aurora",
    source: "aurora",
    preview: "linear-gradient(135deg, #1a0933, #6e3cbc, #ff6ec7)",
    params: [
      { key: "u_c1", kind: "color", label: "Sky", default: "#1a0933" },
      { key: "u_c2", kind: "color", label: "Wash", default: "#6e3cbc" },
      { key: "u_c3", kind: "color", label: "Glow", default: "#ff6ec7" },
      {
        key: "u_intensity",
        kind: "number",
        label: "Intensity",
        default: 1.25,
        min: 0,
        max: 2,
        step: 0.01,
      },
      { key: "u_warp", kind: "number", label: "Warp", default: 1.0, min: 0, max: 2, step: 0.01 },
    ],
    defaults: {
      u_c1: "#1a0933",
      u_c2: "#6e3cbc",
      u_c3: "#ff6ec7",
      u_intensity: 1.25,
      u_warp: 1.0,
    },
  },
  {
    id: "dots-light",
    name: "Dots on light",
    source: "dot-grid",
    preview: "radial-gradient(circle at center, #ddd 10%, #f5f5f7 70%)",
    params: [
      { key: "u_bg", kind: "color", label: "Background", default: "#f5f5f7" },
      { key: "u_dot", kind: "color", label: "Dot", default: "#c9c9ce" },
      {
        key: "u_spacing",
        kind: "number",
        label: "Spacing",
        default: 48,
        min: 10,
        max: 120,
        step: 1,
      },
      {
        key: "u_dotSize",
        kind: "number",
        label: "Dot size",
        default: 0.08,
        min: 0.02,
        max: 0.3,
        step: 0.005,
      },
      {
        key: "u_fade",
        kind: "number",
        label: "Depth fade",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
    defaults: {
      u_bg: "#f5f5f7",
      u_dot: "#c9c9ce",
      u_spacing: 48,
      u_dotSize: 0.08,
      u_fade: 0.5,
    },
  },
  {
    id: "dots-dark",
    name: "Dots on dark",
    source: "dot-grid",
    preview: "radial-gradient(circle at center, #2a2a2e 10%, #101014 70%)",
    params: [
      { key: "u_bg", kind: "color", label: "Background", default: "#0e0e12" },
      { key: "u_dot", kind: "color", label: "Dot", default: "#33333b" },
      {
        key: "u_spacing",
        kind: "number",
        label: "Spacing",
        default: 56,
        min: 10,
        max: 120,
        step: 1,
      },
      {
        key: "u_dotSize",
        kind: "number",
        label: "Dot size",
        default: 0.08,
        min: 0.02,
        max: 0.3,
        step: 0.005,
      },
      {
        key: "u_fade",
        kind: "number",
        label: "Depth fade",
        default: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
    defaults: {
      u_bg: "#0e0e12",
      u_dot: "#33333b",
      u_spacing: 56,
      u_dotSize: 0.08,
      u_fade: 0.55,
    },
  },
  {
    id: "waves",
    name: "Waves",
    source: "waves",
    preview: "linear-gradient(180deg, #ffb199, #ff6ab0)",
    params: [
      { key: "u_c1", kind: "color", label: "Color 1", default: "#ffb199" },
      { key: "u_c2", kind: "color", label: "Color 2", default: "#ff6ab0" },
      {
        key: "u_amp",
        kind: "number",
        label: "Amplitude",
        default: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "u_freq",
        kind: "number",
        label: "Frequency",
        default: 1.2,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
    ],
    defaults: { u_c1: "#ffb199", u_c2: "#ff6ab0", u_amp: 0.3, u_freq: 1.2 },
  },
  {
    id: "topo",
    name: "Topographic",
    source: "topo",
    preview: "linear-gradient(135deg, #141417, #1f1f24)",
    params: [
      { key: "u_bg", kind: "color", label: "Background", default: "#141417" },
      { key: "u_line", kind: "color", label: "Lines", default: "#6a6aff" },
      {
        key: "u_density",
        kind: "number",
        label: "Density",
        default: 3.0,
        min: 1,
        max: 8,
        step: 0.1,
      },
      {
        key: "u_thickness",
        kind: "number",
        label: "Thickness",
        default: 0.035,
        min: 0.005,
        max: 0.1,
        step: 0.002,
      },
    ],
    defaults: {
      u_bg: "#141417",
      u_line: "#6a6aff",
      u_density: 3.0,
      u_thickness: 0.035,
    },
  },
];

export const shaderPresetMap = new Map(shaderPresets.map((p) => [p.id, p]));
