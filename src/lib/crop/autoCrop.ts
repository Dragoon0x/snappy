/**
 * Heuristic auto-crop for screenshots: trims uniform "chrome" strips off the
 * edges (OS title bars, macOS traffic lights, Windows taskbar, browser URL
 * bars) by scanning inward until row/col variance exceeds a threshold.
 *
 * Conservative — when in doubt, returns the original bounds. Pure TS so it
 * runs in both tests and the main thread (fast on typical screenshot sizes).
 */

export type CropRect = { x: number; y: number; width: number; height: number };

type ImageLike = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

/**
 * Variance of RGB across a row (or partial row). Low variance = uniform
 * colour = very likely to be chrome. High variance = actual content.
 */
function rowVariance(img: ImageLike, y: number, x0: number, x1: number): number {
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sr2 = 0;
  let sg2 = 0;
  let sb2 = 0;
  const n = x1 - x0;
  if (n <= 0) return 0;
  for (let x = x0; x < x1; x++) {
    const i = (y * img.width + x) * 4;
    const r = img.data[i]!;
    const g = img.data[i + 1]!;
    const b = img.data[i + 2]!;
    sr += r;
    sg += g;
    sb += b;
    sr2 += r * r;
    sg2 += g * g;
    sb2 += b * b;
  }
  const vr = sr2 / n - (sr / n) * (sr / n);
  const vg = sg2 / n - (sg / n) * (sg / n);
  const vb = sb2 / n - (sb / n) * (sb / n);
  return (vr + vg + vb) / 3;
}

function colVariance(img: ImageLike, x: number, y0: number, y1: number): number {
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sr2 = 0;
  let sg2 = 0;
  let sb2 = 0;
  const n = y1 - y0;
  if (n <= 0) return 0;
  for (let y = y0; y < y1; y++) {
    const i = (y * img.width + x) * 4;
    const r = img.data[i]!;
    const g = img.data[i + 1]!;
    const b = img.data[i + 2]!;
    sr += r;
    sg += g;
    sb += b;
    sr2 += r * r;
    sg2 += g * g;
    sb2 += b * b;
  }
  const vr = sr2 / n - (sr / n) * (sr / n);
  const vg = sg2 / n - (sg / n) * (sg / n);
  const vb = sb2 / n - (sb / n) * (sb / n);
  return (vr + vg + vb) / 3;
}

export type AutoCropOptions = {
  /** Rows/cols below this variance are treated as chrome. */
  chromeThreshold?: number;
  /** Never crop more than this fraction of each edge. */
  maxCropFraction?: number;
  /** Require this many consecutive content rows before stopping (de-noising). */
  confirmRun?: number;
};

export function autoCrop(img: ImageLike, options: AutoCropOptions = {}): CropRect {
  const chromeThreshold = options.chromeThreshold ?? 180;
  const maxCropFraction = options.maxCropFraction ?? 0.3;
  const confirmRun = options.confirmRun ?? 6;

  const { width, height } = img;
  const maxTopCrop = Math.floor(height * maxCropFraction);
  const maxBottomCrop = Math.floor(height * maxCropFraction);
  const maxLeftCrop = Math.floor(width * maxCropFraction);
  const maxRightCrop = Math.floor(width * maxCropFraction);

  // Top
  let top = 0;
  let topRun = 0;
  for (let y = 0; y < maxTopCrop; y++) {
    const v = rowVariance(img, y, 0, width);
    if (v > chromeThreshold) {
      topRun++;
      if (topRun >= confirmRun) {
        top = Math.max(0, y - confirmRun + 1);
        break;
      }
    } else {
      topRun = 0;
      top = y + 1;
    }
  }

  // Bottom
  let bottom = height;
  let bottomRun = 0;
  for (let y = height - 1; y >= height - maxBottomCrop; y--) {
    const v = rowVariance(img, y, 0, width);
    if (v > chromeThreshold) {
      bottomRun++;
      if (bottomRun >= confirmRun) {
        bottom = Math.min(height, y + confirmRun);
        break;
      }
    } else {
      bottomRun = 0;
      bottom = y;
    }
  }

  // Left
  let left = 0;
  let leftRun = 0;
  for (let x = 0; x < maxLeftCrop; x++) {
    const v = colVariance(img, x, top, bottom);
    if (v > chromeThreshold) {
      leftRun++;
      if (leftRun >= confirmRun) {
        left = Math.max(0, x - confirmRun + 1);
        break;
      }
    } else {
      leftRun = 0;
      left = x + 1;
    }
  }

  // Right
  let right = width;
  let rightRun = 0;
  for (let x = width - 1; x >= width - maxRightCrop; x--) {
    const v = colVariance(img, x, top, bottom);
    if (v > chromeThreshold) {
      rightRun++;
      if (rightRun >= confirmRun) {
        right = Math.min(width, x + confirmRun);
        break;
      }
    } else {
      rightRun = 0;
      right = x;
    }
  }

  // Guardrails: if crop is too aggressive (< 40% of original area), back off.
  const cropped = (right - left) * (bottom - top);
  const original = width * height;
  if (cropped / original < 0.4) {
    return { x: 0, y: 0, width, height };
  }
  return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

/**
 * Apply a crop rect to an image and return a new HTMLCanvasElement containing
 * the cropped region. Can be turned back into a Blob via canvas.toBlob.
 */
export function cropToCanvas(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  rect: CropRect,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(rect.width));
  out.height = Math.max(1, Math.round(rect.height));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return out;
}
