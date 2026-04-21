/**
 * Tiny k-means clustering for RGB palette extraction. Pure TypeScript so it
 * can run in a Web Worker without DOM dependencies. Deterministic — starting
 * centroids are picked via k-means++ seeded with a user-provided seed, so
 * tests can pin the exact output.
 */

export type RGB = readonly [number, number, number];

/** A simple xorshift32 so results are deterministic without depending on Math.random. */
function makeRng(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    // Return in [0, 1)
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function sqDistance(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * k-means++ seeding: pick the first centroid uniformly, then pick each
 * subsequent centroid with probability proportional to distance² from the
 * nearest already-picked centroid. Produces much better final clusters than
 * random init, especially on near-monochrome screenshots.
 */
function seedCentroidsPlusPlus(points: ArrayLike<number>, k: number, rng: () => number): RGB[] {
  const nPoints = points.length / 3;
  const centroids: RGB[] = [];

  // First centroid: random point.
  const first = Math.floor(rng() * nPoints);
  centroids.push([points[first * 3]!, points[first * 3 + 1]!, points[first * 3 + 2]!]);

  while (centroids.length < k) {
    // Compute nearest-centroid distance² for every point.
    const dist2 = new Float64Array(nPoints);
    let total = 0;
    for (let i = 0; i < nPoints; i++) {
      const p: RGB = [points[i * 3]!, points[i * 3 + 1]!, points[i * 3 + 2]!];
      let best = Number.POSITIVE_INFINITY;
      for (const c of centroids) {
        const d = sqDistance(p, c);
        if (d < best) best = d;
      }
      dist2[i] = best;
      total += best;
    }
    if (total === 0) break;
    // Sample a point proportionally to dist².
    let r = rng() * total;
    let pickIdx = nPoints - 1;
    for (let i = 0; i < nPoints; i++) {
      r -= dist2[i]!;
      if (r <= 0) {
        pickIdx = i;
        break;
      }
    }
    centroids.push([points[pickIdx * 3]!, points[pickIdx * 3 + 1]!, points[pickIdx * 3 + 2]!]);
  }
  return centroids;
}

export type KmeansResult = {
  centroids: RGB[];
  /** Size of each cluster (pixel count that matched that centroid). */
  sizes: number[];
  /** Centroids sorted by cluster size, largest first. */
  sorted: Array<{ color: RGB; weight: number }>;
};

/**
 * Flatten a set of RGB pixels (as Uint8ClampedArray from an ImageData) into
 * a Float32Array ignoring transparent pixels.
 */
export function collectPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampleRate = 1,
): Float32Array {
  const outCap = Math.ceil((width * height) / sampleRate);
  const out = new Float32Array(outCap * 3);
  let w = 0;
  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      const a = data[i + 3]!;
      if (a < 8) continue;
      out[w * 3] = data[i]!;
      out[w * 3 + 1] = data[i + 1]!;
      out[w * 3 + 2] = data[i + 2]!;
      w++;
    }
  }
  return out.slice(0, w * 3);
}

/**
 * Lloyd's algorithm with k-means++ seeding. Converges quickly in practice
 * for ≤ 10 000 points and k ≤ 8 (typical palette extraction sizes).
 */
export function kmeans(
  pixels: Float32Array,
  k: number,
  options: { maxIterations?: number; seed?: number; tolerance?: number } = {},
): KmeansResult {
  const { maxIterations = 25, seed = 1, tolerance = 1 } = options;
  const nPoints = pixels.length / 3;
  if (nPoints === 0) {
    return { centroids: [], sizes: [], sorted: [] };
  }
  const effK = Math.max(1, Math.min(k, nPoints));
  const rng = makeRng(seed);
  let centroids = seedCentroidsPlusPlus(pixels, effK, rng);
  const assignments = new Int32Array(nPoints);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each point to nearest centroid.
    for (let i = 0; i < nPoints; i++) {
      const p: RGB = [pixels[i * 3]!, pixels[i * 3 + 1]!, pixels[i * 3 + 2]!];
      let best = 0;
      let bestD = Number.POSITIVE_INFINITY;
      for (let c = 0; c < centroids.length; c++) {
        const d = sqDistance(p, centroids[c]!);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assignments[i] = best;
    }
    // Recompute centroids.
    const sums = new Float64Array(effK * 3);
    const counts = new Int32Array(effK);
    for (let i = 0; i < nPoints; i++) {
      const c = assignments[i]!;
      sums[c * 3] = (sums[c * 3] ?? 0) + (pixels[i * 3] ?? 0);
      sums[c * 3 + 1] = (sums[c * 3 + 1] ?? 0) + (pixels[i * 3 + 1] ?? 0);
      sums[c * 3 + 2] = (sums[c * 3 + 2] ?? 0) + (pixels[i * 3 + 2] ?? 0);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    let maxShift = 0;
    const next: RGB[] = [];
    for (let c = 0; c < effK; c++) {
      if (counts[c] === 0) {
        next.push(centroids[c]!);
        continue;
      }
      const nc: RGB = [
        sums[c * 3]! / counts[c]!,
        sums[c * 3 + 1]! / counts[c]!,
        sums[c * 3 + 2]! / counts[c]!,
      ];
      const shift = Math.sqrt(sqDistance(centroids[c]!, nc));
      if (shift > maxShift) maxShift = shift;
      next.push(nc);
    }
    centroids = next;
    if (maxShift < tolerance) break;
  }

  // Final cluster sizes (re-count at converged centroids).
  const sizes = new Array(effK).fill(0);
  for (let i = 0; i < nPoints; i++) sizes[assignments[i]!]++;

  const sorted = centroids
    .map((c, i) => ({
      color: [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])] as RGB,
      weight: sizes[i]! / nPoints,
    }))
    .sort((a, b) => b.weight - a.weight);

  return { centroids, sizes, sorted };
}

export function rgbToHex([r, g, b]: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Filter near-white and near-black clusters (they dominate many screenshots
 * and produce flat backgrounds). Keeps colours with reasonable saturation.
 */
export function saliencyFilter(clusters: Array<{ color: RGB; weight: number }>): Array<{
  color: RGB;
  weight: number;
}> {
  return clusters.filter(({ color }) => {
    const [r, g, b] = color;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = (max + min) / 2;
    const sat = max === 0 ? 0 : (max - min) / max;
    // Drop near-white (luma > 245) and near-black (luma < 10), and drop pure
    // grays with no chroma unless they're distinctly light or dark.
    if (luma > 245) return false;
    if (luma < 10) return false;
    if (sat < 0.05 && luma > 40 && luma < 220) return false;
    return true;
  });
}
