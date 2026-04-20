import type { RenderAssets } from "@/lib/render/types";
import { useAssetStore } from "@/store/assetStore";
import type { Document } from "@/types/document";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import Scene from "./Scene";
import { setThreeCanvas } from "./stageHandle";

type Props = {
  doc: Document;
  width: number;
  height: number;
};

/**
 * Lazy-mounted r3f Canvas. The parent swaps between this and the Konva Stage
 * based on doc.viewMode. Everything Three-adjacent lives below this component
 * so Vite can code-split it into its own chunk.
 */
export default function ThreeStage({ doc, width, height }: Props) {
  const cache = useAssetStore((s) => s.cache);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const assets = useMemo<RenderAssets>(() => {
    const images = new Map<string, HTMLImageElement>();
    for (const [id, entry] of cache) {
      if (entry.image) images.set(id, entry.image);
    }
    return { images };
  }, [cache]);

  // Expose the underlying canvas DOM element globally so the unified export
  // pipeline can read pixels from it in 3D mode.
  useEffect(() => {
    const el = hostRef.current?.querySelector("canvas");
    setThreeCanvas(el ?? null);
    return () => setThreeCanvas(null);
  }, []);

  return (
    <div
      ref={hostRef}
      style={{ width, height, position: "absolute", inset: 0 }}
      className="three-stage-host"
    >
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
        camera={{ position: [0, 0.4, 2.2], fov: 30 }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={[0, 0, 0]} />
        <Suspense fallback={null}>
          <Scene doc={doc} assets={assets} />
        </Suspense>
      </Canvas>
    </div>
  );
}
