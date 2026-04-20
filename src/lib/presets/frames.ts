import type { FrameId } from "@/types/document";

export type FrameDef = {
  id: FrameId;
  label: string;
  category: "window" | "desktop" | "mobile" | "tablet" | "none";
  /** Height of the top chrome (title bar + URL bar for browser frames). */
  headerHeight: number;
  /** Padding around the content (for bezel devices like iPhone / MacBook). */
  bezelPad: number;
  /** Corner radius of the outer frame body. */
  cornerRadius: number;
  /** Corner radius of the inner content clip. Defaults to 0 for window frames, matches bezel curvature for mobile. */
  contentCornerRadius: number;
  /** Fill color for the frame body. When a bezel device the body is colored (iPhone black), otherwise white. */
  bodyColor?: { light: string; dark: string };
  /** Aspect ratio hint (width/height). 0 = any. */
  aspect: number;
  hasControls: boolean;
};

export const frameDefs: Record<FrameId, FrameDef> = {
  none: {
    id: "none",
    label: "None",
    category: "none",
    headerHeight: 0,
    bezelPad: 0,
    cornerRadius: 0,
    contentCornerRadius: 0,
    aspect: 0,
    hasControls: false,
  },
  floating: {
    id: "floating",
    label: "Floating",
    category: "none",
    headerHeight: 0,
    bezelPad: 0,
    cornerRadius: 16,
    contentCornerRadius: 16,
    aspect: 0,
    hasControls: false,
  },
  "macos-window": {
    id: "macos-window",
    label: "macOS",
    category: "window",
    headerHeight: 36,
    bezelPad: 0,
    cornerRadius: 12,
    contentCornerRadius: 0,
    aspect: 0,
    hasControls: true,
  },
  "browser-chrome": {
    id: "browser-chrome",
    label: "Chrome",
    category: "window",
    headerHeight: 72,
    bezelPad: 0,
    cornerRadius: 12,
    contentCornerRadius: 0,
    aspect: 0,
    hasControls: true,
  },
  "browser-safari": {
    id: "browser-safari",
    label: "Safari",
    category: "window",
    headerHeight: 56,
    bezelPad: 0,
    cornerRadius: 14,
    contentCornerRadius: 0,
    aspect: 0,
    hasControls: true,
  },
  "iphone-15-pro": {
    id: "iphone-15-pro",
    label: "iPhone",
    category: "mobile",
    headerHeight: 0,
    bezelPad: 14,
    cornerRadius: 64,
    contentCornerRadius: 50,
    bodyColor: { light: "#0b0b0d", dark: "#0b0b0d" },
    aspect: 1179 / 2556,
    hasControls: false,
  },
  "mbp-14": {
    id: "mbp-14",
    label: "MacBook",
    category: "desktop",
    headerHeight: 0,
    bezelPad: 10,
    cornerRadius: 18,
    contentCornerRadius: 8,
    bodyColor: { light: "#151518", dark: "#0c0c0e" },
    aspect: 16 / 10,
    hasControls: false,
  },
};

export const frameList: FrameDef[] = Object.values(frameDefs);
