import { frameDefs } from "@/lib/presets/frames";
import { renderScreenshot } from "@/lib/render/screenshot";
import type { RenderAssets } from "@/lib/render/types";
import type { Document } from "@/types/document";

/**
 * Render only the composed screenshot (image + frame + shadow) into a fresh
 * canvas, with the scene transparent so the texture can be applied to a 3D
 * plane with correct alpha. Returns the natural dimensions too, so the caller
 * can build a correctly-proportioned plane geometry.
 */
export function renderDeviceToCanvas(
  doc: Document,
  assets: RenderAssets,
  /** Target width; height is derived from the screenshot aspect including frame. */
  targetWidth: number,
): { canvas: HTMLCanvasElement; width: number; height: number; aspect: number } {
  const def = frameDefs[doc.screenshot.frame.id];
  const padding = 32; // small margin to keep the shadow inside the texture bounds

  // Determine the content + frame dimensions in doc coords.
  const asset = doc.screenshot.assetId ? assets.images.get(doc.screenshot.assetId) : null;
  const iw = asset
    ? "width" in asset
      ? asset.width
      : (asset as HTMLImageElement).naturalWidth
    : 1600;
  const ih = asset
    ? "height" in asset
      ? asset.height
      : (asset as HTMLImageElement).naturalHeight
    : 900;

  const maxContent = 1600;
  const s = Math.min(maxContent / iw, maxContent / ih);
  const contentW = iw * s;
  const contentH = ih * s;
  const outerW = contentW + def.bezelPad * 2;
  const outerH = contentH + def.bezelPad * 2 + def.headerHeight;

  // Canvas dims include a shadow margin.
  const shadow = doc.screenshot.shadow;
  const shadowMargin = shadow.enabled ? Math.max(shadow.blur, 40) + padding : padding;
  const docW = outerW + shadowMargin * 2;
  const docH = outerH + shadowMargin * 2;

  const scale = targetWidth / docW;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(docW * scale));
  canvas.height = Math.max(1, Math.round(docH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, docW, docH);

  // Construct a mini-document that positions the screenshot in the centre of the
  // new canvas with no background, so renderScreenshot does its usual math.
  const miniDoc: Document = {
    ...doc,
    canvas: { width: docW, height: docH },
    background: { kind: "transparent" },
    screenshot: {
      ...doc.screenshot,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      padding: shadowMargin,
    },
  };

  renderScreenshot(ctx, miniDoc, assets);

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    aspect: canvas.width / canvas.height,
  };
}
