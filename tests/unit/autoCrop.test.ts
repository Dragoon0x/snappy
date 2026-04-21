import { autoCrop } from "@/lib/crop/autoCrop";
import { describe, expect, it } from "vitest";

/** Build a fake ImageData-like with the top `chromeRows` rows painted as
 *  uniform gray chrome and the rest filled with noisy content. */
function buildImage(
  width: number,
  height: number,
  chromeRows: number,
  chromeColor: [number, number, number] = [200, 200, 200],
): { data: Uint8ClampedArray; width: number; height: number } {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (y < chromeRows) {
        data[i] = chromeColor[0];
        data[i + 1] = chromeColor[1];
        data[i + 2] = chromeColor[2];
      } else {
        // Deterministic hash-noise content.
        const n = ((x * 2654435761) ^ (y * 1597334677)) >>> 0;
        data[i] = n & 0xff;
        data[i + 1] = (n >> 8) & 0xff;
        data[i + 2] = (n >> 16) & 0xff;
      }
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

describe("autoCrop", () => {
  it("trims a flat chrome strip off the top", () => {
    const img = buildImage(100, 200, 30);
    const rect = autoCrop(img, { chromeThreshold: 180, confirmRun: 4 });
    expect(rect.y).toBeGreaterThanOrEqual(26);
    expect(rect.y).toBeLessThanOrEqual(34);
    expect(rect.x).toBe(0);
    expect(rect.width).toBe(100);
    expect(rect.height).toBeGreaterThan(150);
  });

  it("leaves an image without obvious chrome untouched", () => {
    const img = buildImage(100, 200, 0);
    const rect = autoCrop(img, { chromeThreshold: 180 });
    expect(rect).toEqual({ x: 0, y: 0, width: 100, height: 200 });
  });

  it("refuses to crop too aggressively", () => {
    // 80% of the image is flat chrome — autocrop would be too destructive.
    const img = buildImage(100, 100, 80);
    const rect = autoCrop(img, { chromeThreshold: 180, maxCropFraction: 0.3 });
    // With 30% max crop per edge and the content starting at y=80, we can
    // only trim up to y=30 from the top. Either we do a partial crop within
    // the cap or back off entirely when the crop is too aggressive.
    expect(rect.y).toBeLessThanOrEqual(30);
  });
});
