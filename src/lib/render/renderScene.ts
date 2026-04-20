import { renderAnnotations } from "./annotations";
import { renderBackground } from "./background";
import { renderScreenshot } from "./screenshot";
import type { Ctx2D, RenderSceneOptions } from "./types";

/**
 * Pure 2D renderer for a Snappy Document. The caller provides a Canvas2D
 * context (or OffscreenCanvasRenderingContext2D) and the target size; the
 * renderer scales the document to fit via ctx.setTransform.
 */
export async function renderScene(ctx: Ctx2D, opts: RenderSceneOptions): Promise<void> {
  const { doc, width, height, pixelRatio, assets, renderShader } = opts;

  // Output canvas is width*pixelRatio × height*pixelRatio physical px.
  // We draw in document logical coordinates (canvas.width × canvas.height),
  // so set a transform that maps logical → physical.
  const scaleX = (width * pixelRatio) / doc.canvas.width;
  const scaleY = (height * pixelRatio) / doc.canvas.height;
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  ctx.clearRect(0, 0, doc.canvas.width, doc.canvas.height);

  await renderBackground(
    ctx,
    doc.background,
    doc.canvas.width,
    doc.canvas.height,
    assets,
    renderShader,
  );
  renderScreenshot(ctx, doc, assets);
  renderAnnotations(ctx, doc, assets);
}
