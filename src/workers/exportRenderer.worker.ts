/// <reference lib="WebWorker" />
import { renderScene } from "@/lib/render/renderScene";
import { renderShaderToOffscreen } from "@/lib/render/shaderBridge";
import type { Document } from "@/types/document";

declare const self: DedicatedWorkerGlobalScope;

export type ExportRequest = {
  id: number;
  type: "export";
  doc: Document;
  assets: Record<string, ImageBitmap>;
  mosaic: Record<string, ImageBitmap>;
  format: "png" | "jpg" | "webp";
  quality: number;
  pixelRatio: number;
};

export type ExportResponse =
  | { id: number; type: "export"; ok: true; blob: Blob; width: number; height: number }
  | { id: number; type: "export"; ok: false; error: string };

self.addEventListener("message", async (ev: MessageEvent<ExportRequest>) => {
  const req = ev.data;
  if (!req || req.type !== "export") return;
  try {
    const outW = Math.max(1, Math.round(req.doc.canvas.width * req.pixelRatio));
    const outH = Math.max(1, Math.round(req.doc.canvas.height * req.pixelRatio));
    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable in worker");

    const assetImages = new Map<string, ImageBitmap>();
    for (const [id, bmp] of Object.entries(req.assets)) assetImages.set(id, bmp);
    const assetMosaic = new Map<string, ImageBitmap>();
    for (const [id, bmp] of Object.entries(req.mosaic)) assetMosaic.set(id, bmp);

    await renderScene(ctx, {
      doc: req.doc,
      width: req.doc.canvas.width,
      height: req.doc.canvas.height,
      pixelRatio: req.pixelRatio,
      assets: { images: assetImages, mosaic: assetMosaic },
      renderShader: async (presetId, params, seed, w, h) => {
        return await renderShaderToOffscreen(presetId, params, seed, w, h);
      },
    });

    const mime =
      req.format === "png" ? "image/png" : req.format === "webp" ? "image/webp" : "image/jpeg";
    const blob = await canvas.convertToBlob({ type: mime, quality: req.quality });

    const response: ExportResponse = {
      id: req.id,
      type: "export",
      ok: true,
      blob,
      width: outW,
      height: outH,
    };
    self.postMessage(response);

    // Release transferred bitmaps.
    for (const bmp of Object.values(req.assets)) bmp.close?.();
    for (const bmp of Object.values(req.mosaic)) bmp.close?.();
  } catch (err) {
    const response: ExportResponse = {
      id: req.id,
      type: "export",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
});
