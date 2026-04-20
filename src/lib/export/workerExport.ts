import { buildMosaicCanvas } from "@/canvas/annotations/mosaic";
import { downloadBlob } from "@/lib/utils";
import { useAssetStore } from "@/store/assetStore";
import type { Document } from "@/types/document";
import type { ExportRequest, ExportResponse } from "@/workers/exportRenderer.worker";
import type { ExportFormat } from "./png";

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (r: ExportResponse) => void; reject: (e: Error) => void }
>();

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(new URL("../../workers/exportRenderer.worker.ts", import.meta.url), {
    type: "module",
    name: "snappy-export",
  });
  workerInstance.addEventListener("message", (ev: MessageEvent<ExportResponse>) => {
    const msg = ev.data;
    if (!msg || msg.type !== "export") return;
    const waiter = pending.get(msg.id);
    if (!waiter) return;
    pending.delete(msg.id);
    waiter.resolve(msg);
  });
  workerInstance.addEventListener("error", (ev) => {
    for (const [, waiter] of pending) waiter.reject(new Error(ev.message));
    pending.clear();
  });
  return workerInstance;
}

export function isWorkerExportSupported(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

export type WorkerExportOptions = {
  doc: Document;
  format: ExportFormat;
  quality: number;
  pixelRatio: number;
};

/**
 * Collect image bitmaps for all assets referenced by the document and a
 * mosaic texture for blur-masks. Returns transferable objects for postMessage.
 */
async function collectAssetBitmaps(doc: Document): Promise<{
  assets: Record<string, ImageBitmap>;
  mosaic: Record<string, ImageBitmap>;
  transfer: Transferable[];
}> {
  const cache = useAssetStore.getState().cache;
  const referenced = new Set<string>();
  if (doc.screenshot.assetId) referenced.add(doc.screenshot.assetId);
  if (doc.background.kind === "image") referenced.add(doc.background.assetId);

  const assets: Record<string, ImageBitmap> = {};
  const mosaic: Record<string, ImageBitmap> = {};
  const transfer: Transferable[] = [];

  const needsMosaic = doc.annotations.some((a) => a.type === "blur") && doc.screenshot.assetId;

  for (const id of referenced) {
    const entry = cache.get(id);
    if (!entry?.image) continue;
    const bmp = await createImageBitmap(entry.image);
    assets[id] = bmp;
    transfer.push(bmp);
  }

  if (needsMosaic && doc.screenshot.assetId) {
    const entry = cache.get(doc.screenshot.assetId);
    if (entry?.image) {
      // Use a size that matches the smallest pixel size used by blur-masks.
      const minPixel =
        doc.annotations.reduce<number>((m, a) => {
          if (a.type !== "blur") return m;
          return Math.min(m, a.pixelSize);
        }, Number.POSITIVE_INFINITY) || 16;
      const mosaicCanvas = buildMosaicCanvas(entry.image, Math.max(8, Math.round(minPixel * 1.5)));
      const bmp = await createImageBitmap(mosaicCanvas);
      mosaic[doc.screenshot.assetId] = bmp;
      transfer.push(bmp);
    }
  }

  return { assets, mosaic, transfer };
}

export async function exportViaWorker(opts: WorkerExportOptions): Promise<Blob> {
  const worker = getWorker();
  const { assets, mosaic, transfer } = await collectAssetBitmaps(opts.doc);

  const id = nextId++;
  const req: ExportRequest = {
    id,
    type: "export",
    doc: opts.doc,
    assets,
    mosaic,
    format: opts.format,
    quality: opts.quality,
    pixelRatio: opts.pixelRatio,
  };

  const result = await new Promise<ExportResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage(req, transfer);
  });

  if (!result.ok) throw new Error(result.error);
  return result.blob;
}

export async function exportAndDownloadViaWorker(
  opts: WorkerExportOptions,
  baseName: string,
): Promise<void> {
  const blob = await exportViaWorker(opts);
  const ext = opts.format === "jpg" ? "jpg" : opts.format;
  const suffix = opts.pixelRatio !== 1 ? `@${opts.pixelRatio}x` : "";
  downloadBlob(blob, `${baseName}${suffix}.${ext}`);
}

export async function exportAndCopyViaWorker(doc: Document): Promise<void> {
  const blob = await exportViaWorker({ doc, format: "png", quality: 1, pixelRatio: 2 });
  if (!("clipboard" in navigator) || !("write" in navigator.clipboard)) {
    throw new Error("Clipboard image write not supported");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
