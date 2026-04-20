import type { Document } from "@/types/document";

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Source for an image asset. In the main thread we accept either HTMLImageElement
 * (what the Konva preview uses) or an ImageBitmap (what we ship to the worker).
 * In the worker only ImageBitmap is accepted.
 */
export type ImageSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export type RenderAssets = {
  /** Map of assetId → image source. */
  images: Map<string, ImageSource>;
  /**
   * Optional pre-computed mosaic texture for the primary screenshot asset,
   * used to fill blur-mask annotations. Keyed by assetId.
   */
  mosaic?: Map<string, ImageSource>;
};

export type ShaderRenderFn = (
  sourceId: string,
  params: Record<string, string | number>,
  seed: number,
  width: number,
  height: number,
) => Promise<ImageSource | null>;

export type RenderSceneOptions = {
  doc: Document;
  width: number;
  height: number;
  /** pixel ratio for scaling (e.g. 2 for @2x) */
  pixelRatio: number;
  assets: RenderAssets;
  /**
   * When rendering a shader background, the renderer calls this to obtain a
   * rasterized image. The worker's implementation uses a WebGL2 OffscreenCanvas;
   * the main-thread implementation reuses the shader/runtime module.
   */
  renderShader?: ShaderRenderFn;
};
