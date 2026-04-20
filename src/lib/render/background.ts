import type { Background } from "@/types/document";
import type { Ctx2D, RenderAssets, ShaderRenderFn } from "./types";
import { drawImageContain, drawImageCover, linearGradientPoints } from "./util";

export async function renderBackground(
  ctx: Ctx2D,
  bg: Background,
  width: number,
  height: number,
  assets: RenderAssets,
  renderShader?: ShaderRenderFn,
): Promise<void> {
  if (bg.kind === "transparent") return;

  if (bg.kind === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (bg.kind === "linearGradient") {
    const { x0, y0, x1, y1 } = linearGradientPoints(width, height, bg.angle);
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const stop of bg.stops) grad.addColorStop(stop.offset, stop.color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (bg.kind === "radialGradient") {
    const r = Math.hypot(width, height) / 2;
    const grad = ctx.createRadialGradient(
      width * bg.cx,
      height * bg.cy,
      0,
      width * bg.cx,
      height * bg.cy,
      r,
    );
    for (const stop of bg.stops) grad.addColorStop(stop.offset, stop.color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (bg.kind === "meshGradient") {
    // Approximation: four-corner blend via two overlaid diagonal gradients.
    const [a, b, c, d] = bg.colors;
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, width, height);
    const g1 = ctx.createLinearGradient(0, 0, width, 0);
    g1.addColorStop(0, `${a}ff`);
    g1.addColorStop(1, `${b}00`);
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);
    const g2 = ctx.createLinearGradient(0, 0, 0, height);
    g2.addColorStop(0, `${c}00`);
    g2.addColorStop(1, `${d}cc`);
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (bg.kind === "shader") {
    if (!renderShader) return;
    const image = await renderShader(bg.presetId, bg.params, bg.seed, width, height);
    if (image) ctx.drawImage(image, 0, 0, width, height);
    return;
  }

  if (bg.kind === "image") {
    const src = assets.images.get(bg.assetId);
    if (!src) return;
    const iw = "width" in src ? src.width : (src as HTMLImageElement).naturalWidth;
    const ih = "height" in src ? src.height : (src as HTMLImageElement).naturalHeight;
    if (!iw || !ih) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    if (bg.blur > 0) {
      // Best-effort in a worker where ctx.filter may be unavailable.
      try {
        (ctx as CanvasRenderingContext2D).filter = `blur(${bg.blur}px)`;
      } catch {
        /* ignore */
      }
    }
    if (bg.fit === "cover") drawImageCover(ctx, src, iw, ih, 0, 0, width, height);
    else if (bg.fit === "contain") drawImageContain(ctx, src, iw, ih, 0, 0, width, height);
    else ctx.drawImage(src, 0, 0, width, height);
    try {
      (ctx as CanvasRenderingContext2D).filter = "none";
    } catch {
      /* ignore */
    }
    ctx.restore();
  }
}
