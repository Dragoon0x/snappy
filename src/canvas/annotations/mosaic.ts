/**
 * Generate a low-resolution pixelation of the screenshot asset.
 * Used as a fillPatternImage for blur-mask annotations so redactions show
 * the underlying content as a mosaic (unreadable but visually coherent).
 */
export function buildMosaicCanvas(source: HTMLImageElement, targetSize = 24): HTMLCanvasElement {
  const aspect = source.naturalWidth / source.naturalHeight;
  const small = document.createElement("canvas");
  if (aspect >= 1) {
    small.width = targetSize;
    small.height = Math.max(1, Math.round(targetSize / aspect));
  } else {
    small.width = Math.max(1, Math.round(targetSize * aspect));
    small.height = targetSize;
  }
  const sctx = small.getContext("2d");
  if (!sctx) throw new Error("2d context unavailable");
  sctx.drawImage(source, 0, 0, small.width, small.height);

  const big = document.createElement("canvas");
  big.width = source.naturalWidth;
  big.height = source.naturalHeight;
  const bctx = big.getContext("2d");
  if (!bctx) throw new Error("2d context unavailable");
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}
