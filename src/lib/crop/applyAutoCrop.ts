import { ingestImageFile } from "@/lib/assets";
import { useAssetStore } from "@/store/assetStore";
import { useDocumentStore } from "@/store/documentStore";
import { autoCrop, cropToCanvas } from "./autoCrop";

/**
 * Detect and strip OS/browser chrome on the current screenshot. Creates a
 * new asset with the cropped image, swaps the document's screenshot to
 * reference it. Returns the crop rect (in original asset pixels), or null
 * if the heuristic decided nothing safe to crop.
 */
export async function applyAutoCropToCurrentAsset(): Promise<{
  cropped: boolean;
  rect: { x: number; y: number; width: number; height: number } | null;
  originalWidth: number;
  originalHeight: number;
}> {
  const doc = useDocumentStore.getState().doc;
  const assetId = doc.screenshot.assetId;
  if (!assetId) {
    return { cropped: false, rect: null, originalWidth: 0, originalHeight: 0 };
  }
  const entry = useAssetStore.getState().cache.get(assetId);
  if (!entry?.image) {
    return { cropped: false, rect: null, originalWidth: 0, originalHeight: 0 };
  }

  const w = entry.image.naturalWidth;
  const h = entry.image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(entry.image, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);

  const rect = autoCrop({ data: imageData.data, width: w, height: h });
  if (rect.width === w && rect.height === h) {
    return { cropped: false, rect, originalWidth: w, originalHeight: h };
  }

  const cropped = cropToCanvas(entry.image, rect);
  const blob = await new Promise<Blob>((resolve, reject) => {
    cropped.toBlob(
      (b) => {
        if (!b) return reject(new Error("toBlob returned null"));
        resolve(b);
      },
      "image/png",
      1,
    );
  });

  const ingested = await ingestImageFile(blob, doc.id);
  useDocumentStore.getState().attachAsset(ingested.id);

  return { cropped: true, rect, originalWidth: w, originalHeight: h };
}
