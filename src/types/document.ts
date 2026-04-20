export const CURRENT_SCHEMA_VERSION = 2 as const;

export type SchemaVersion = typeof CURRENT_SCHEMA_VERSION;

export type ViewMode = "2d" | "3d";

export type ThreePreset = "hero" | "isometric" | "floating" | "angled";

export type ThreeEnvironment = "studio" | "city" | "sunset" | "warehouse" | "night" | "apartment";

export type ThreeConfig = {
  preset: ThreePreset;
  environment: ThreeEnvironment;
  /** Manual tilt around the three axes in degrees (applied over the preset). */
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  /** Floating distance above the ground plane, world units. */
  elevation: number;
  /** 0 = no shadow, 1 = dense. */
  shadowStrength: number;
  /** Bloom post-process intensity (0–1). */
  bloom: number;
  /** Camera distance multiplier over the preset default. */
  distance: number;
};

export type Shadow = {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  spread: number;
  opacity: number;
};

export type GradientStop = { color: string; offset: number };

export type Background =
  | { kind: "solid"; color: string }
  | { kind: "linearGradient"; stops: GradientStop[]; angle: number }
  | { kind: "radialGradient"; stops: GradientStop[]; cx: number; cy: number }
  | { kind: "meshGradient"; colors: [string, string, string, string]; seed: number }
  | {
      kind: "shader";
      presetId: string;
      params: Record<string, string | number>;
      seed: number;
    }
  | { kind: "image"; assetId: string; fit: "cover" | "contain" | "tile"; blur: number }
  | { kind: "transparent" };

export type FrameId =
  | "none"
  | "macos-window"
  | "browser-chrome"
  | "browser-safari"
  | "iphone-15-pro"
  | "mbp-14"
  | "floating";

export type FrameSpec = {
  id: FrameId;
  variant: "light" | "dark";
  controls: {
    tabTitle: string;
    url: string;
    showButtons: boolean;
  };
};

export type Screenshot = {
  assetId: string | null;
  frame: FrameSpec;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  padding: number;
  cornerRadius: number;
  shadow: Shadow;
  tiltX: number;
  tiltY: number;
};

export type AnnotationSpace = "canvas" | "screenshot";

export type BaseAnnotation = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  space: AnnotationSpace;
};

export type TextAnnotation = BaseAnnotation & {
  type: "text";
  text: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
  fontFamily: string;
};

export type ShapeAnnotation = BaseAnnotation & {
  type: "shape";
  shape: "rect" | "ellipse";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
};

export type ArrowAnnotation = BaseAnnotation & {
  type: "arrow";
  toX: number;
  toY: number;
  color: string;
  strokeWidth: number;
  style: "straight" | "curved";
};

export type BlurMaskAnnotation = BaseAnnotation & {
  type: "blur";
  width: number;
  height: number;
  cornerRadius: number;
  /** Pixel size for mosaic effect; higher = chunkier redaction. */
  pixelSize: number;
};

export type Annotation = TextAnnotation | ShapeAnnotation | ArrowAnnotation | BlurMaskAnnotation;

export type AnnotationType = Annotation["type"];

export type CanvasSpec = {
  width: number;
  height: number;
  aspectPreset?: string;
};

export type Document = {
  schemaVersion: SchemaVersion;
  id: string;
  name: string;
  canvas: CanvasSpec;
  background: Background;
  screenshot: Screenshot;
  annotations: Annotation[];
  assetRefs: string[];
  viewMode: ViewMode;
  three: ThreeConfig;
  createdAt: number;
  updatedAt: number;
};

export const defaultThreeConfig = (): ThreeConfig => ({
  preset: "hero",
  environment: "studio",
  tiltX: 0,
  tiltY: 0,
  tiltZ: 0,
  elevation: 0,
  shadowStrength: 0.6,
  bloom: 0.18,
  distance: 1,
});

export const defaultTextAnnotation = (id: string, x: number, y: number): TextAnnotation => ({
  id,
  type: "text",
  space: "canvas",
  x,
  y,
  rotation: 0,
  opacity: 1,
  locked: false,
  text: "Type something",
  fontSize: 36,
  fontWeight: 600,
  color: "#ffffff",
  align: "left",
  fontFamily: "Inter, system-ui, sans-serif",
});

export const defaultShapeAnnotation = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  shape: "rect" | "ellipse",
): ShapeAnnotation => ({
  id,
  type: "shape",
  space: "canvas",
  x,
  y,
  rotation: 0,
  opacity: 1,
  locked: false,
  shape,
  width,
  height,
  fill: "rgba(0,0,0,0)",
  stroke: "#ff3b5c",
  strokeWidth: 4,
  cornerRadius: shape === "rect" ? 8 : 0,
});

export const defaultArrowAnnotation = (
  id: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): ArrowAnnotation => ({
  id,
  type: "arrow",
  space: "canvas",
  x: fromX,
  y: fromY,
  toX,
  toY,
  rotation: 0,
  opacity: 1,
  locked: false,
  color: "#ff3b5c",
  strokeWidth: 5,
  style: "straight",
});

export const defaultBlurMaskAnnotation = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): BlurMaskAnnotation => ({
  id,
  type: "blur",
  space: "canvas",
  x,
  y,
  rotation: 0,
  opacity: 1,
  locked: false,
  width,
  height,
  cornerRadius: 6,
  pixelSize: 14,
});

export const defaultShadow = (): Shadow => ({
  enabled: true,
  color: "#000000",
  blur: 60,
  offsetX: 0,
  offsetY: 30,
  spread: 0,
  opacity: 0.35,
});

export const defaultFrame = (): FrameSpec => ({
  id: "macos-window",
  variant: "dark",
  controls: {
    tabTitle: "Snappy",
    url: "snappy.app",
    showButtons: true,
  },
});

export const defaultScreenshot = (): Screenshot => ({
  assetId: null,
  frame: defaultFrame(),
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  padding: 120,
  cornerRadius: 14,
  shadow: defaultShadow(),
  tiltX: 0,
  tiltY: 0,
});
