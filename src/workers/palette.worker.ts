/// <reference lib="WebWorker" />
import { kmeans, rgbToHex, saliencyFilter } from "@/lib/palette/kmeans";

declare const self: DedicatedWorkerGlobalScope;

export type PaletteRequest = {
  id: number;
  type: "palette";
  bitmap: ImageBitmap;
  k: number;
  sampleSize: number;
};

export type PaletteResponse =
  | {
      id: number;
      type: "palette";
      ok: true;
      colors: Array<{ hex: string; rgb: [number, number, number]; weight: number }>;
    }
  | { id: number; type: "palette"; ok: false; error: string };

self.addEventListener("message", async (ev: MessageEvent<PaletteRequest>) => {
  const req = ev.data;
  if (!req || req.type !== "palette") return;
  try {
    const size = Math.max(16, Math.min(256, req.sampleSize));
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable in worker");
    // Letterbox the bitmap into a square so aspect ratio doesn't bias sampling.
    const iw = req.bitmap.width;
    const ih = req.bitmap.height;
    const scale = Math.min(size / iw, size / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(req.bitmap, (size - dw) / 2, (size - dh) / 2, dw, dh);
    req.bitmap.close?.();
    const imageData = ctx.getImageData(0, 0, size, size);
    const pixels = new Float32Array((imageData.data.length / 4) * 3);
    let w = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3]! < 8) continue;
      pixels[w * 3] = imageData.data[i]!;
      pixels[w * 3 + 1] = imageData.data[i + 1]!;
      pixels[w * 3 + 2] = imageData.data[i + 2]!;
      w++;
    }
    const trimmed = pixels.slice(0, w * 3);
    const result = kmeans(trimmed, req.k, { maxIterations: 18, seed: 7 });
    const salient = saliencyFilter(result.sorted);
    const picks = (salient.length >= 3 ? salient : result.sorted).slice(0, req.k);
    const colors = picks.map((c) => ({
      hex: rgbToHex(c.color),
      rgb: c.color as [number, number, number],
      weight: c.weight,
    }));
    const response: PaletteResponse = { id: req.id, type: "palette", ok: true, colors };
    self.postMessage(response);
  } catch (err) {
    const response: PaletteResponse = {
      id: req.id,
      type: "palette",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
});
