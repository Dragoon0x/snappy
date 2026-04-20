import { downloadBlob } from "@/lib/utils";
import type Konva from "konva";

export type ExportFormat = "png" | "jpg" | "webp";

export type ExportOptions = {
  format: ExportFormat;
  pixelRatio: number;
  quality: number;
  filename?: string;
};

export function exportStageToCanvas(stage: Konva.Stage, pixelRatio: number): HTMLCanvasElement {
  const savedScale = { x: stage.scaleX(), y: stage.scaleY() };
  const savedPos = { x: stage.x(), y: stage.y() };
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });

  const canvas = stage.toCanvas({
    x: 0,
    y: 0,
    width: stageLogicalSize(stage).width,
    height: stageLogicalSize(stage).height,
    pixelRatio,
  });

  stage.scale(savedScale);
  stage.position(savedPos);
  return canvas;
}

function stageLogicalSize(stage: Konva.Stage): { width: number; height: number } {
  const attr = stage.getAttrs() as {
    __docWidth?: number;
    __docHeight?: number;
  };
  if (attr.__docWidth && attr.__docHeight) {
    return { width: attr.__docWidth, height: attr.__docHeight };
  }
  return { width: stage.width(), height: stage.height() };
}

export async function exportStage(
  stage: Konva.Stage,
  docWidth: number,
  docHeight: number,
  options: ExportOptions,
): Promise<Blob> {
  stage.setAttrs({ __docWidth: docWidth, __docHeight: docHeight });

  const savedScale = { x: stage.scaleX(), y: stage.scaleY() };
  const savedPos = { x: stage.x(), y: stage.y() };
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });

  let blob: Blob;
  try {
    const canvas = stage.toCanvas({
      x: 0,
      y: 0,
      width: docWidth,
      height: docHeight,
      pixelRatio: options.pixelRatio,
    });

    const mime =
      options.format === "png"
        ? "image/png"
        : options.format === "webp"
          ? "image/webp"
          : "image/jpeg";

    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) return reject(new Error("canvas.toBlob returned null"));
          resolve(b);
        },
        mime,
        options.quality,
      );
    });
  } finally {
    stage.scale(savedScale);
    stage.position(savedPos);
  }

  return blob;
}

export async function exportAndDownload(
  stage: Konva.Stage,
  docWidth: number,
  docHeight: number,
  options: ExportOptions,
  baseName: string,
): Promise<void> {
  const blob = await exportStage(stage, docWidth, docHeight, options);
  const ext = options.format === "jpg" ? "jpg" : options.format;
  const suffix = options.pixelRatio !== 1 ? `@${options.pixelRatio}x` : "";
  const filename = options.filename ?? `${baseName}${suffix}.${ext}`;
  downloadBlob(blob, filename);
}

export async function exportAndCopy(
  stage: Konva.Stage,
  docWidth: number,
  docHeight: number,
): Promise<void> {
  const blob = await exportStage(stage, docWidth, docHeight, {
    format: "png",
    pixelRatio: 2,
    quality: 1,
  });
  if (!("clipboard" in navigator) || !("write" in navigator.clipboard)) {
    throw new Error("Clipboard image write not supported");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
