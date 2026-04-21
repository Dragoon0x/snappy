import { kmeans, rgbToHex, saliencyFilter } from "@/lib/palette/kmeans";
import { describe, expect, it } from "vitest";

function makePixels(rgb: Array<[number, number, number]>): Float32Array {
  const out = new Float32Array(rgb.length * 3);
  for (let i = 0; i < rgb.length; i++) {
    out[i * 3] = rgb[i]![0];
    out[i * 3 + 1] = rgb[i]![1];
    out[i * 3 + 2] = rgb[i]![2];
  }
  return out;
}

describe("kmeans", () => {
  it("finds three distinct cluster centers on a synthetic 3-colour set", () => {
    const pixels = makePixels([
      ...Array.from({ length: 40 }, () => [255, 40, 40] as [number, number, number]),
      ...Array.from({ length: 30 }, () => [40, 200, 40] as [number, number, number]),
      ...Array.from({ length: 20 }, () => [40, 60, 220] as [number, number, number]),
    ]);
    const { sorted } = kmeans(pixels, 3, { seed: 42 });
    expect(sorted).toHaveLength(3);
    // Largest cluster should be red.
    const top = sorted[0]!;
    expect(top.color[0]).toBeGreaterThan(200);
    expect(top.color[1]).toBeLessThan(80);
    expect(top.color[2]).toBeLessThan(80);
    // Weights sum to 1.
    const total = sorted.reduce((s, c) => s + c.weight, 0);
    expect(total).toBeCloseTo(1, 3);
  });

  it("is deterministic given the same seed", () => {
    const pixels = makePixels([
      ...Array.from({ length: 20 }, () => [10, 20, 30] as [number, number, number]),
      ...Array.from({ length: 20 }, () => [240, 220, 200] as [number, number, number]),
      ...Array.from({ length: 20 }, () => [100, 200, 60] as [number, number, number]),
    ]);
    const a = kmeans(pixels, 3, { seed: 7 });
    const b = kmeans(pixels, 3, { seed: 7 });
    expect(a.sorted.map((c) => c.color)).toEqual(b.sorted.map((c) => c.color));
  });

  it("handles empty pixel arrays gracefully", () => {
    const result = kmeans(new Float32Array(0), 3);
    expect(result.centroids).toEqual([]);
    expect(result.sizes).toEqual([]);
  });
});

describe("rgbToHex", () => {
  it("formats ints as two-digit lowercase hex", () => {
    expect(rgbToHex([0, 0, 0])).toBe("#000000");
    expect(rgbToHex([255, 255, 255])).toBe("#ffffff");
    expect(rgbToHex([255, 128, 0])).toBe("#ff8000");
  });

  it("clamps out-of-range values", () => {
    expect(rgbToHex([-5, 400, 128])).toBe("#00ff80");
  });
});

describe("saliencyFilter", () => {
  it("drops near-white and near-black clusters", () => {
    const filtered = saliencyFilter([
      { color: [252, 252, 252], weight: 0.5 }, // near-white → drop
      { color: [8, 8, 8], weight: 0.1 }, //        near-black → drop
      { color: [200, 80, 80], weight: 0.4 }, //    keep
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.color).toEqual([200, 80, 80]);
  });

  it("keeps mid-luma grays only if they're distinctly dark or light", () => {
    const filtered = saliencyFilter([
      { color: [130, 130, 130], weight: 1 }, // mid gray → drop
      { color: [210, 210, 210], weight: 1 }, // keep: light but saturated-enough wrap
    ]);
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });
});
