export type DecodedImage = {
  bitmap: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
};

export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(blob);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // fall through to HTMLImageElement path
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode image"));
      el.src = url;
    });
    return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function blobFromHTMLImageElement(img: HTMLImageElement): Promise<Blob> {
  const response = await fetch(img.src);
  return response.blob();
}

export function detectAspectPreset(width: number, height: number): string | undefined {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return "desktop";
  if (Math.abs(ratio - 4 / 3) < 0.05) return "classic";
  if (Math.abs(ratio - 1) < 0.05) return "square";
  if (ratio < 0.6) return "mobile";
  if (ratio < 0.8) return "tablet";
  return undefined;
}

export function suggestedFrameForAspect(width: number, height: number): string {
  const ratio = width / height;
  if (ratio < 0.7) return "iphone-15-pro";
  if (ratio > 1.3) return "browser-chrome";
  return "floating";
}
