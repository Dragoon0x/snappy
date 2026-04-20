import { getScreenshotGeom } from "@/canvas/annotations/annotationGeom";
import type { Annotation, Document } from "@/types/document";
import type { Ctx2D, RenderAssets } from "./types";
import { roundedRectPath } from "./util";

export function renderAnnotations(ctx: Ctx2D, doc: Document, assets: RenderAssets): void {
  for (const a of doc.annotations) {
    renderAnnotation(ctx, a, doc, assets);
  }
}

function renderAnnotation(ctx: Ctx2D, a: Annotation, doc: Document, assets: RenderAssets): void {
  ctx.save();
  ctx.globalAlpha *= a.opacity;

  if (a.type === "text") {
    ctx.translate(a.x, a.y);
    if (a.rotation) ctx.rotate((a.rotation * Math.PI) / 180);
    ctx.font = `${a.fontWeight} ${a.fontSize}px ${a.fontFamily}`;
    ctx.fillStyle = a.color;
    ctx.textBaseline = "top";
    const lines = a.text.split("\n");
    const lineHeight = a.fontSize * 1.25;
    let maxWidth = 0;
    for (const line of lines) maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      let x = 4;
      if (a.align === "center") {
        const w = ctx.measureText(line).width;
        x = 4 + (maxWidth - w) / 2;
        ctx.textAlign = "left";
      } else if (a.align === "right") {
        const w = ctx.measureText(line).width;
        x = 4 + (maxWidth - w);
        ctx.textAlign = "left";
      } else {
        ctx.textAlign = "left";
      }
      ctx.fillText(line, x, 4 + i * lineHeight);
    }
    ctx.restore();
    return;
  }

  if (a.type === "shape") {
    if (a.shape === "ellipse") {
      ctx.translate(a.x + a.width / 2, a.y + a.height / 2);
      if (a.rotation) ctx.rotate((a.rotation * Math.PI) / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, a.width / 2), Math.max(1, a.height / 2), 0, 0, Math.PI * 2);
      if (a.fill && a.fill !== "rgba(0,0,0,0)") {
        ctx.fillStyle = a.fill;
        ctx.fill();
      }
      if (a.strokeWidth > 0) {
        ctx.lineWidth = a.strokeWidth;
        ctx.strokeStyle = a.stroke;
        ctx.stroke();
      }
    } else {
      ctx.translate(a.x, a.y);
      if (a.rotation) ctx.rotate((a.rotation * Math.PI) / 180);
      roundedRectPath(ctx, 0, 0, Math.max(1, a.width), Math.max(1, a.height), a.cornerRadius);
      if (a.fill && a.fill !== "rgba(0,0,0,0)") {
        ctx.fillStyle = a.fill;
        ctx.fill();
      }
      if (a.strokeWidth > 0) {
        ctx.lineWidth = a.strokeWidth;
        ctx.strokeStyle = a.stroke;
        ctx.stroke();
      }
    }
    ctx.restore();
    return;
  }

  if (a.type === "arrow") {
    // Draw arrow shaft + arrowhead from (a.x,a.y) to (a.toX,a.toY).
    const dx = a.toX - a.x;
    const dy = a.toY - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) {
      ctx.restore();
      return;
    }
    const pointerLen = 12 + a.strokeWidth;
    const pointerWid = 12 + a.strokeWidth;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const baseX = a.toX - ux * pointerLen;
    const baseY = a.toY - uy * pointerLen;

    // shaft
    ctx.lineWidth = a.strokeWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = a.color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(baseX, baseY);
    ctx.stroke();

    // arrowhead triangle
    ctx.fillStyle = a.color;
    ctx.beginPath();
    ctx.moveTo(a.toX, a.toY);
    ctx.lineTo(baseX + (px * pointerWid) / 2, baseY + (py * pointerWid) / 2);
    ctx.lineTo(baseX - (px * pointerWid) / 2, baseY - (py * pointerWid) / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    return;
  }

  if (a.type === "blur") {
    const mosaic = assets.mosaic?.get(doc.screenshot.assetId ?? "") ?? null;
    if (!mosaic) {
      // Fallback: neutral gray redaction
      ctx.translate(a.x, a.y);
      if (a.rotation) ctx.rotate((a.rotation * Math.PI) / 180);
      roundedRectPath(ctx, 0, 0, a.width, a.height, a.cornerRadius);
      ctx.fillStyle = "#40404a";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.stroke();
      ctx.restore();
      return;
    }

    const geom = getScreenshotGeom(
      doc.canvas.width,
      doc.canvas.height,
      doc.screenshot,
      assets.images.get(doc.screenshot.assetId ?? "")
        ? "width" in assets.images.get(doc.screenshot.assetId ?? "")!
          ? (assets.images.get(doc.screenshot.assetId ?? "") as ImageBitmap).width
          : (assets.images.get(doc.screenshot.assetId ?? "") as HTMLImageElement).naturalWidth
        : null,
      assets.images.get(doc.screenshot.assetId ?? "")
        ? "height" in assets.images.get(doc.screenshot.assetId ?? "")!
          ? (assets.images.get(doc.screenshot.assetId ?? "") as ImageBitmap).height
          : (assets.images.get(doc.screenshot.assetId ?? "") as HTMLImageElement).naturalHeight
        : null,
    );

    // Mosaic lives at asset natural resolution; we want to sample the piece of
    // that bitmap that lies under (a.x, a.y, a.w, a.h) in canvas coords.
    const asset = assets.images.get(doc.screenshot.assetId ?? "");
    if (!asset) {
      ctx.restore();
      return;
    }
    const iw = "width" in asset ? asset.width : (asset as HTMLImageElement).naturalWidth;
    const ih = "height" in asset ? asset.height : (asset as HTMLImageElement).naturalHeight;
    const scaleX = geom.contentWidth / iw;
    const scaleY = geom.contentHeight / ih;
    const srcX = (a.x - geom.contentX) / scaleX;
    const srcY = (a.y - geom.contentY) / scaleY;
    const srcW = a.width / scaleX;
    const srcH = a.height / scaleY;

    ctx.translate(a.x, a.y);
    if (a.rotation) ctx.rotate((a.rotation * Math.PI) / 180);

    ctx.save();
    roundedRectPath(ctx, 0, 0, a.width, a.height, a.cornerRadius);
    ctx.clip();
    // Clamp src to asset bounds to avoid out-of-range drawImage errors.
    const clampedX = Math.max(0, Math.min(iw - 1, srcX));
    const clampedY = Math.max(0, Math.min(ih - 1, srcY));
    const clampedW = Math.max(1, Math.min(iw - clampedX, srcW));
    const clampedH = Math.max(1, Math.min(ih - clampedY, srcH));
    const dx = (clampedX - srcX) * scaleX;
    const dy = (clampedY - srcY) * scaleY;
    const dw = clampedW * scaleX;
    const dh = clampedH * scaleY;
    ctx.drawImage(mosaic, clampedX, clampedY, clampedW, clampedH, dx, dy, dw, dh);
    ctx.restore();

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    roundedRectPath(ctx, 0, 0, a.width, a.height, a.cornerRadius);
    ctx.stroke();

    ctx.restore();
    return;
  }

  ctx.restore();
}
