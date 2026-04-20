import { db, saveAsset } from "@/lib/db/dexie";
import { uid } from "@/lib/ids";
import { decodeImage } from "@/lib/image/decode";
import { loadAssetBlobIntoCache, useAssetStore } from "@/store/assetStore";

export async function ingestImageFile(
  file: File | Blob,
  documentId: string,
): Promise<{ id: string; width: number; height: number }> {
  const id = uid("asset");
  const decoded = await decodeImage(file);
  const blob = file instanceof File ? file : file;
  await saveAsset({
    id,
    documentId,
    blob,
    mimeType: blob.type || "image/png",
    width: decoded.width,
    height: decoded.height,
    createdAt: Date.now(),
  });
  await loadAssetBlobIntoCache(id, blob);
  return { id, width: decoded.width, height: decoded.height };
}

export async function hydrateDocumentAssets(documentId: string): Promise<void> {
  const assets = await db.assets.where("documentId").equals(documentId).toArray();
  await Promise.all(
    assets.map(async (a) => {
      if (!useAssetStore.getState().cache.has(a.id)) {
        await loadAssetBlobIntoCache(a.id, a.blob);
      }
    }),
  );
}
