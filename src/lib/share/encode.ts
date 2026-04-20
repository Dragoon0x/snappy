import type { Document } from "@/types/document";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export const MAX_SHARE_PAYLOAD = 4000;

export type EncodeResult =
  | { ok: true; payload: string; url: string }
  | { ok: false; reason: "too-large"; size: number };

export function encodeDocumentForShare(doc: Document, baseUrl?: string): EncodeResult {
  const { assetRefs: _assetRefs, ...rest } = doc;
  const transmittable = { ...rest, assetRefs: [] };
  const json = JSON.stringify(transmittable);
  const payload = compressToEncodedURIComponent(json);
  if (payload.length > MAX_SHARE_PAYLOAD) {
    return { ok: false, reason: "too-large", size: payload.length };
  }
  const origin =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://snappy.app");
  return { ok: true, payload, url: `${origin}/#/s/${payload}` };
}

export function decodeShareString(payload: string): Document | null {
  try {
    const json = decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    return JSON.parse(json) as Document;
  } catch {
    return null;
  }
}
