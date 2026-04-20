import { frameDefs } from "@/lib/presets/frames";
import type { Document } from "@/types/document";
import { renderFrame } from "./frames";
import type { Ctx2D, RenderAssets } from "./types";
import { colorWithAlpha, roundedRectPath } from "./util";

export function renderScreenshot(ctx: Ctx2D, doc: Document, assets: RenderAssets): void {
  const { screenshot, canvas } = doc;
  const def = frameDefs[screenshot.frame.id];
  const padding = Math.max(0, screenshot.padding);
  const headerH = def.headerHeight;
  const bezel = def.bezelPad;

  const asset = screenshot.assetId ? assets.images.get(screenshot.assetId) : undefined;
  const assetW = asset
    ? "width" in asset
      ? asset.width
      : (asset as HTMLImageElement).naturalWidth
    : 0;
  const assetH = asset
    ? "height" in asset
      ? asset.height
      : (asset as HTMLImageElement).naturalHeight
    : 0;

  const maxW = Math.max(64, canvas.width - padding * 2 - bezel * 2);
  const maxH = Math.max(64, canvas.height - padding * 2 - headerH - bezel * 2);
  let contentW: number;
  let contentH: number;
  if (assetW && assetH) {
    const s = Math.min(maxW / assetW, maxH / assetH);
    contentW = Math.max(1, assetW * s);
    contentH = Math.max(1, assetH * s);
  } else {
    contentW = Math.min(800, maxW);
    contentH = Math.min(500, maxH);
  }

  const outerW = contentW + bezel * 2;
  const outerH = contentH + bezel * 2 + headerH;
  const groupOffsetX = outerW / 2 - bezel;
  const groupOffsetY = outerH / 2 - bezel - headerH;

  const cx = canvas.width / 2 + screenshot.x;
  const cy = canvas.height / 2 + screenshot.y;

  ctx.save();
  ctx.translate(cx, cy);
  if (screenshot.rotation) {
    ctx.rotate((screenshot.rotation * Math.PI) / 180);
  }
  if (screenshot.scale !== 1) {
    ctx.scale(screenshot.scale, screenshot.scale);
  }
  ctx.translate(-groupOffsetX, -groupOffsetY);

  const bodyColor =
    def.bodyColor?.[screenshot.frame.variant] ??
    (def.id === "none" || def.id === "floating" ? null : "#ffffff");

  // Outer body + shadow. For 'none' frame, content is rendered transparent without body
  // fill; we still apply a shadow via a phantom rect.
  const shadow = screenshot.shadow;
  const outerX = -bezel;
  const outerY = -(bezel + headerH);

  if (def.id === "none") {
    // No body fill; draw content directly with optional shadow.
    if (shadow.enabled) {
      ctx.save();
      ctx.shadowColor = colorWithAlpha(shadow.color, shadow.opacity);
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
      roundedRectPath(ctx, 0, 0, contentW, contentH, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.save();
    if (shadow.enabled) {
      ctx.shadowColor = colorWithAlpha(shadow.color, shadow.opacity);
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
    }
    roundedRectPath(ctx, outerX, outerY, outerW, outerH, def.cornerRadius);
    ctx.fillStyle = bodyColor ?? "#ffffff";
    ctx.fill();
    ctx.restore();
  }

  // Frame chrome
  renderFrame(ctx, screenshot.frame, contentW, contentH);

  // Content clip
  ctx.save();
  roundedRectPath(ctx, 0, 0, contentW, contentH, def.contentCornerRadius);
  ctx.clip();

  if (asset) {
    ctx.drawImage(asset, 0, 0, contentW, contentH);
  } else {
    // Placeholder — simple neutral fill
    ctx.fillStyle = "#f4f4f6";
    ctx.fillRect(0, 0, contentW, contentH);
  }
  ctx.restore();

  ctx.restore();
}
