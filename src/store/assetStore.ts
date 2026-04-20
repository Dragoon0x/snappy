import { create } from "zustand";

type AssetCacheEntry = {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  image: HTMLImageElement | null;
};

type AssetState = {
  cache: Map<string, AssetCacheEntry>;
  put: (entry: AssetCacheEntry) => void;
  get: (id: string) => AssetCacheEntry | undefined;
  remove: (id: string) => void;
  clear: () => void;
};

export const useAssetStore = create<AssetState>((set, get) => ({
  cache: new Map(),

  put: (entry) =>
    set((state) => {
      const existing = state.cache.get(entry.id);
      if (existing) {
        URL.revokeObjectURL(existing.url);
      }
      const next = new Map(state.cache);
      next.set(entry.id, entry);
      return { cache: next };
    }),

  get: (id) => get().cache.get(id),

  remove: (id) =>
    set((state) => {
      const existing = state.cache.get(id);
      if (existing) URL.revokeObjectURL(existing.url);
      const next = new Map(state.cache);
      next.delete(id);
      return { cache: next };
    }),

  clear: () =>
    set((state) => {
      for (const entry of state.cache.values()) URL.revokeObjectURL(entry.url);
      return { cache: new Map() };
    }),
}));

export async function loadAssetBlobIntoCache(id: string, blob: Blob): Promise<AssetCacheEntry> {
  const url = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load asset image"));
    el.src = url;
  });
  const entry: AssetCacheEntry = {
    id,
    blob,
    url,
    width: img.naturalWidth,
    height: img.naturalHeight,
    image: img,
  };
  useAssetStore.getState().put(entry);
  return entry;
}
