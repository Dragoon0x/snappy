import type { Background, FrameId, FrameSpec, Screenshot, Shadow } from "@/types/document";
import { defaultShadow } from "@/types/document";

export type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
  category: "social" | "product" | "showcase";
  canvas: { width: number; height: number; aspectPreset?: string };
  background: Background;
  frame: Partial<FrameSpec> & { id: FrameId };
  screenshot: Omit<Partial<Screenshot>, "shadow"> & { shadow?: Partial<Shadow> };
  preview: string; // CSS background for thumbnail
};

export const templates: DocumentTemplate[] = [
  {
    id: "twitter-hero",
    name: "X / Twitter post",
    description: "1600×900 hero shot with soft gradient and browser frame.",
    category: "social",
    canvas: { width: 1600, height: 900, aspectPreset: "twitter-post" },
    background: {
      kind: "shader",
      presetId: "aurora-night",
      params: {
        u_c1: "#0b1e3f",
        u_c2: "#2d6d9e",
        u_c3: "#5df2c2",
        u_intensity: 1.1,
        u_warp: 0.8,
      },
      seed: 42,
    },
    frame: { id: "browser-chrome", variant: "dark" },
    screenshot: {
      padding: 140,
      cornerRadius: 14,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 80, offsetY: 40, opacity: 0.5 },
    },
    preview: "linear-gradient(135deg, #0b1e3f, #2d6d9e, #5df2c2)",
  },
  {
    id: "product-hunt",
    name: "Product Hunt",
    description: "Saturated cosmic shader with macOS window.",
    category: "social",
    canvas: { width: 1600, height: 900, aspectPreset: "product-hunt" },
    background: {
      kind: "shader",
      presetId: "aurora-cosmic",
      params: {
        u_c1: "#1a0933",
        u_c2: "#6e3cbc",
        u_c3: "#ff6ec7",
        u_intensity: 1.25,
        u_warp: 1.0,
      },
      seed: 17,
    },
    frame: { id: "macos-window", variant: "dark" },
    screenshot: {
      padding: 130,
      cornerRadius: 16,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 120, offsetY: 50, opacity: 0.55 },
    },
    preview: "linear-gradient(135deg, #1a0933, #6e3cbc, #ff6ec7)",
  },
  {
    id: "dribbble",
    name: "Dribbble shot",
    description: "4:3 framed shot with mesh gradient.",
    category: "social",
    canvas: { width: 1600, height: 1200, aspectPreset: "dribbble" },
    background: {
      kind: "shader",
      presetId: "mesh-sunset",
      params: {
        u_c1: "#ff6a88",
        u_c2: "#feb47b",
        u_c3: "#8f94fb",
        u_c4: "#43e97b",
        u_blend: 0.6,
      },
      seed: 1,
    },
    frame: { id: "floating", variant: "light" },
    screenshot: {
      padding: 180,
      cornerRadius: 22,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 90, offsetY: 38, opacity: 0.32 },
    },
    preview: "linear-gradient(135deg, #ff6a88 0%, #feb47b 50%, #8f94fb 100%)",
  },
  {
    id: "readme",
    name: "GitHub README",
    description: "Clean dots on light, ideal for README hero.",
    category: "showcase",
    canvas: { width: 1400, height: 900, aspectPreset: "readme" },
    background: {
      kind: "shader",
      presetId: "dots-light",
      params: {
        u_bg: "#f5f5f7",
        u_dot: "#c9c9ce",
        u_spacing: 48,
        u_dotSize: 0.08,
        u_fade: 0.55,
      },
      seed: 1,
    },
    frame: { id: "browser-chrome", variant: "light" },
    screenshot: {
      padding: 100,
      cornerRadius: 10,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 50, offsetY: 20, opacity: 0.16 },
    },
    preview:
      "radial-gradient(circle at center, #ddd 10%, #f5f5f7 70%), conic-gradient(from 90deg, #ffffff 20%, transparent 80%)",
  },
  {
    id: "app-store",
    name: "App Store",
    description: "Portrait phone hero on dark dots.",
    category: "product",
    canvas: { width: 1080, height: 1920, aspectPreset: "phone" },
    background: {
      kind: "shader",
      presetId: "dots-dark",
      params: {
        u_bg: "#0e0e12",
        u_dot: "#33333b",
        u_spacing: 70,
        u_dotSize: 0.08,
        u_fade: 0.55,
      },
      seed: 1,
    },
    frame: { id: "iphone-15-pro", variant: "dark" },
    screenshot: {
      padding: 120,
      cornerRadius: 50,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 90, offsetY: 48, opacity: 0.45 },
    },
    preview: "radial-gradient(circle at center, #2a2a2e 10%, #101014 70%)",
  },
  {
    id: "hero-tilted",
    name: "Hero (tilted)",
    description: "Subtle tilt, cosmic mesh, big soft shadow.",
    category: "showcase",
    canvas: { width: 1920, height: 1080, aspectPreset: "desktop-hd" },
    background: {
      kind: "shader",
      presetId: "aurora-cosmic",
      params: {
        u_c1: "#0f0a1f",
        u_c2: "#5a2aa3",
        u_c3: "#ff8ae2",
        u_intensity: 1.2,
        u_warp: 1.1,
      },
      seed: 7,
    },
    frame: { id: "browser-safari", variant: "dark" },
    screenshot: {
      padding: 160,
      cornerRadius: 14,
      scale: 1,
      rotation: -3,
      shadow: { enabled: true, blur: 140, offsetY: 60, opacity: 0.55 },
    },
    preview: "linear-gradient(135deg, #0f0a1f, #5a2aa3, #ff8ae2)",
  },
  {
    id: "topo-dark",
    name: "Topographic",
    description: "Techy topo background, great for devtools shots.",
    category: "showcase",
    canvas: { width: 1920, height: 1080, aspectPreset: "desktop-hd" },
    background: {
      kind: "shader",
      presetId: "topo",
      params: {
        u_bg: "#0a0a10",
        u_line: "#6a6aff",
        u_density: 3.0,
        u_thickness: 0.035,
      },
      seed: 5,
    },
    frame: { id: "macos-window", variant: "dark" },
    screenshot: {
      padding: 150,
      cornerRadius: 12,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 100, offsetY: 40, opacity: 0.5 },
    },
    preview: "linear-gradient(135deg, #0a0a10 0%, #1a1a40 100%)",
  },
  {
    id: "instagram-square",
    name: "Instagram 1:1",
    description: "Square composition with waves gradient.",
    category: "social",
    canvas: { width: 1200, height: 1200, aspectPreset: "instagram-square" },
    background: {
      kind: "shader",
      presetId: "waves",
      params: { u_c1: "#ffb199", u_c2: "#ff6ab0", u_amp: 0.35, u_freq: 1.2 },
      seed: 3,
    },
    frame: { id: "floating", variant: "light" },
    screenshot: {
      padding: 160,
      cornerRadius: 22,
      scale: 1,
      rotation: 0,
      shadow: { enabled: true, blur: 80, offsetY: 36, opacity: 0.28 },
    },
    preview: "linear-gradient(180deg, #ffb199, #ff6ab0)",
  },
];

export function applyTemplate(
  tpl: DocumentTemplate,
  current: { frame: FrameSpec; screenshot: Screenshot },
): {
  canvas: { width: number; height: number; aspectPreset?: string };
  background: Background;
  frame: FrameSpec;
  screenshot: Screenshot;
} {
  const shadow: Shadow = {
    ...defaultShadow(),
    ...current.screenshot.shadow,
    ...tpl.screenshot.shadow,
  };
  return {
    canvas: tpl.canvas,
    background: tpl.background,
    frame: {
      ...current.frame,
      ...tpl.frame,
    },
    screenshot: {
      ...current.screenshot,
      ...tpl.screenshot,
      shadow,
    },
  };
}
