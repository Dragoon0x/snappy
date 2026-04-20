import { frameDefs } from "@/lib/presets/frames";
import type { Screenshot } from "@/types/document";

/**
 * Geometry of the screenshot group in canvas-space, used to transform
 * annotation positions between canvas coords and screenshot content coords.
 *
 * The screenshot group in ScreenshotNode:
 *   Group at (canvas.w/2 + sx, canvas.h/2 + sy)
 *     scale = scr.scale, rotation = scr.rotation (deg)
 *     offsetX = outerW/2 - bezel, offsetY = outerH/2 - bezel - headerH
 *     inside, content lives at (0, 0) → (contentW, contentH)
 *
 * We only care about a correct forward mapping for blur-mask placement. The
 * mapping without rotation is fine for v1.1 — most users do not rotate
 * the screenshot and blur-mask anyway.
 */
export type ScreenshotGeom = {
  /** Top-left of the content (image) area in canvas coords. */
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  scale: number;
};

export function getScreenshotGeom(
  canvasWidth: number,
  canvasHeight: number,
  screenshot: Screenshot,
  assetWidth: number | null,
  assetHeight: number | null,
): ScreenshotGeom {
  const def = frameDefs[screenshot.frame.id];
  const padding = Math.max(0, screenshot.padding);
  const bezel = def.bezelPad;
  const headerH = def.headerHeight;

  const maxW = Math.max(64, canvasWidth - padding * 2 - bezel * 2);
  const maxH = Math.max(64, canvasHeight - padding * 2 - headerH - bezel * 2);

  let contentW: number;
  let contentH: number;
  if (assetWidth && assetHeight) {
    const s = Math.min(maxW / assetWidth, maxH / assetHeight);
    contentW = assetWidth * s;
    contentH = assetHeight * s;
  } else {
    contentW = Math.min(800, maxW);
    contentH = Math.min(500, maxH);
  }
  contentW = Math.max(1, contentW);
  contentH = Math.max(1, contentH);

  const outerW = contentW + bezel * 2;
  const outerH = contentH + bezel * 2 + headerH;
  const groupOffsetX = outerW / 2 - bezel;
  const groupOffsetY = outerH / 2 - bezel - headerH;

  const cx = canvasWidth / 2 + screenshot.x;
  const cy = canvasHeight / 2 + screenshot.y;

  // Content (local 0,0) sits at (cx - groupOffsetX*scale, cy - groupOffsetY*scale)
  // when rotation is 0. For non-zero rotation we'd need a full matrix; we keep
  // this simple and accept that blur-mask looks slightly off on rotated scenes.
  const contentX = cx - groupOffsetX * screenshot.scale;
  const contentY = cy - groupOffsetY * screenshot.scale;

  return {
    contentX,
    contentY,
    contentWidth: contentW * screenshot.scale,
    contentHeight: contentH * screenshot.scale,
    scale: screenshot.scale,
  };
}
