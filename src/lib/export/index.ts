import { getThreeCanvas } from "@/canvas/three/stageHandle";
import { downloadBlob } from "@/lib/utils";
import type { Document } from "@/types/document";
import type Konva from "konva";
import { exportAndCopy as konvaCopy, exportAndDownload as konvaDownload } from "./png";
import {
  exportAndCopyViaWorker,
  exportAndDownloadViaWorker,
  isWorkerExportSupported,
} from "./workerExport";

async function exportThreeCanvas(format: ExportFormat, quality: number): Promise<Blob> {
  const canvas = getThreeCanvas();
  if (!canvas) throw new Error("3D canvas not mounted");
  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("toBlob returned null"));
        resolve(b);
      },
      mime,
      quality,
    );
  });
}

export type ExportFormat = "png" | "jpg" | "webp";

export type UnifiedExportOptions = {
  doc: Document;
  stage: Konva.Stage | null;
  format: ExportFormat;
  pixelRatio: number;
  quality: number;
  filename: string;
};

/**
 * Preferred path: Worker + OffscreenCanvas (non-blocking, any pixel ratio).
 * Fallback: Konva's synchronous stage.toCanvas() on the main thread.
 */
export async function downloadExport(opts: UnifiedExportOptions): Promise<void> {
  if (opts.doc.viewMode === "3d") {
    const blob = await exportThreeCanvas(opts.format, opts.quality);
    const ext = opts.format === "jpg" ? "jpg" : opts.format;
    const suffix = opts.pixelRatio !== 1 ? `@${opts.pixelRatio}x` : "";
    downloadBlob(blob, `${opts.filename}${suffix}.${ext}`);
    return;
  }
  if (isWorkerExportSupported()) {
    await exportAndDownloadViaWorker(
      {
        doc: opts.doc,
        format: opts.format,
        quality: opts.quality,
        pixelRatio: opts.pixelRatio,
      },
      opts.filename,
    );
    return;
  }
  if (!opts.stage) throw new Error("Stage unavailable and no worker fallback");
  await konvaDownload(
    opts.stage,
    opts.doc.canvas.width,
    opts.doc.canvas.height,
    { format: opts.format, pixelRatio: opts.pixelRatio, quality: opts.quality },
    opts.filename,
  );
}

export async function copyExport(opts: UnifiedExportOptions): Promise<void> {
  if (opts.doc.viewMode === "3d") {
    const blob = await exportThreeCanvas("png", 1);
    if (!("clipboard" in navigator) || !("write" in navigator.clipboard)) {
      throw new Error("Clipboard image write not supported");
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return;
  }
  if (isWorkerExportSupported()) {
    await exportAndCopyViaWorker(opts.doc);
    return;
  }
  if (!opts.stage) throw new Error("Stage unavailable and no worker fallback");
  await konvaCopy(opts.stage, opts.doc.canvas.width, opts.doc.canvas.height);
}
