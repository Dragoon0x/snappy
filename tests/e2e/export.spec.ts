import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { resetDocument, waitForHook } from "./fixtures";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = path.join(__dirname, "..", "goldens");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = Number.parseInt(a[i]!, 16) ^ Number.parseInt(b[i]!, 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

test("worker export produces a valid PNG at requested resolution", async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);
  await resetDocument(page);

  const result = await page.evaluate(async () => {
    const mod = (await import("/src/lib/export/workerExport.ts")) as unknown as {
      exportViaWorker: (opts: {
        doc: unknown;
        format: "png" | "jpg" | "webp";
        pixelRatio: number;
        quality: number;
      }) => Promise<Blob>;
    };
    const hook = (
      window as unknown as {
        __SNAPPY__: { document: { getState: () => { doc: unknown } } };
      }
    ).__SNAPPY__;
    const doc = hook.document.getState().doc as { canvas: { width: number; height: number } };
    const start = performance.now();
    const blob = await mod.exportViaWorker({ doc, format: "png", pixelRatio: 2, quality: 1 });
    const elapsed = performance.now() - start;
    const buf = new Uint8Array(await blob.arrayBuffer());
    // PNG magic bytes
    const pngSig = [137, 80, 78, 71, 13, 10, 26, 10];
    const validSig = pngSig.every((b, i) => buf[i] === b);
    const bmp = await createImageBitmap(blob);
    return {
      elapsed_ms: Math.round(elapsed),
      size: blob.size,
      validSig,
      width: bmp.width,
      height: bmp.height,
      expected_width: doc.canvas.width * 2,
      expected_height: doc.canvas.height * 2,
    };
  });

  expect(result.validSig).toBe(true);
  expect(result.width).toBe(result.expected_width);
  expect(result.height).toBe(result.expected_height);
  expect(result.size).toBeGreaterThan(1000);
  expect(result.elapsed_ms).toBeLessThan(5000);
});

test("export dHash matches the golden (±8 bits tolerance)", async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);

  // Deterministic scene: solid color + known shader with fixed seed.
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: {
          document: {
            getState: () => {
              reset: () => void;
              setCanvasSize: (w: number, h: number) => void;
              setBackground: (bg: unknown) => void;
            };
          };
        };
      }
    ).__SNAPPY__;
    const s = hook.document.getState();
    s.reset();
    s.setCanvasSize(800, 600);
    s.setBackground({
      kind: "shader",
      presetId: "mesh-sunset",
      params: {
        u_c1: "#ff6a88",
        u_c2: "#feb47b",
        u_c3: "#8f94fb",
        u_c4: "#43e97b",
        u_blend: 0.6,
      },
      seed: 42,
    });
  });

  const hash = await page.evaluate(async () => {
    const mod = (await import("/src/lib/export/workerExport.ts")) as unknown as {
      exportViaWorker: (opts: {
        doc: unknown;
        format: "png" | "jpg" | "webp";
        pixelRatio: number;
        quality: number;
      }) => Promise<Blob>;
    };
    const hook = (
      window as unknown as {
        __SNAPPY__: { document: { getState: () => { doc: unknown } } };
      }
    ).__SNAPPY__;
    const doc = hook.document.getState().doc as unknown;
    const blob = await mod.exportViaWorker({ doc, format: "png", pixelRatio: 1, quality: 1 });

    // Compute a 64-bit dHash: downsample to 9x8 grayscale, bit for each
    // neighbor-greater-than comparison.
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(9, 8);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0, 9, 8);
    const data = ctx.getImageData(0, 0, 9, 8).data;
    let bits = 0n;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const i = (y * 9 + x) * 4;
        const j = (y * 9 + x + 1) * 4;
        const l1 = data[i]! + data[i + 1]! + data[i + 2]!;
        const l2 = data[j]! + data[j + 1]! + data[j + 2]!;
        bits = (bits << 1n) | (l1 < l2 ? 1n : 0n);
      }
    }
    return bits.toString(16).padStart(16, "0");
  });

  ensureDir(GOLDENS_DIR);
  const goldenPath = path.join(GOLDENS_DIR, "mesh-sunset-seed42.dhash");
  if (!fs.existsSync(goldenPath)) {
    // First-run bootstrap: write the golden and mark the test passing with a note.
    fs.writeFileSync(goldenPath, `${hash}\n`, "utf-8");
    test.info().annotations.push({ type: "golden-written", description: hash });
    return;
  }
  const golden = fs.readFileSync(goldenPath, "utf-8").trim();
  const distance = hammingDistanceHex(hash, golden);
  expect(
    distance,
    `dHash drift too large.\nObserved: ${hash}\nGolden:   ${golden}\nDistance: ${distance}`,
  ).toBeLessThanOrEqual(8);
});
