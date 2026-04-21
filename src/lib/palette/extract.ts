import type { PaletteRequest, PaletteResponse } from "@/workers/palette.worker";

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (r: PaletteResponse) => void; reject: (e: Error) => void }
>();

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(new URL("../../workers/palette.worker.ts", import.meta.url), {
    type: "module",
    name: "snappy-palette",
  });
  workerInstance.addEventListener("message", (ev: MessageEvent<PaletteResponse>) => {
    const msg = ev.data;
    if (!msg || msg.type !== "palette") return;
    const waiter = pending.get(msg.id);
    if (!waiter) return;
    pending.delete(msg.id);
    waiter.resolve(msg);
  });
  workerInstance.addEventListener("error", (ev) => {
    for (const [, waiter] of pending) waiter.reject(new Error(ev.message));
    pending.clear();
  });
  return workerInstance;
}

export type ExtractedPalette = {
  hex: string;
  rgb: [number, number, number];
  weight: number;
};

export async function extractPalette(
  source: HTMLImageElement | ImageBitmap | HTMLCanvasElement,
  options: { k?: number; sampleSize?: number } = {},
): Promise<ExtractedPalette[]> {
  const k = options.k ?? 5;
  const sampleSize = options.sampleSize ?? 96;

  const bitmap = await createImageBitmap(source);

  const worker = getWorker();
  const id = nextId++;
  const req: PaletteRequest = { id, type: "palette", bitmap, k, sampleSize };
  const result = await new Promise<PaletteResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage(req, [bitmap]);
  });
  if (!result.ok) throw new Error(result.error);
  return result.colors;
}
