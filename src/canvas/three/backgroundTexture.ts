import { renderBackground } from "@/lib/render/background";
import { renderShaderToOffscreen } from "@/lib/render/shaderBridge";
import type { RenderAssets } from "@/lib/render/types";
import type { Background } from "@/types/document";

export async function renderBackgroundToCanvas(
  bg: Background,
  width: number,
  height: number,
  assets: RenderAssets,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  await renderBackground(ctx, bg, canvas.width, canvas.height, assets, renderShaderToOffscreen);
  return canvas;
}
