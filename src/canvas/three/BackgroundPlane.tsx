import type { RenderAssets } from "@/lib/render/types";
import type { Background } from "@/types/document";
import { useEffect, useState } from "react";
import { CanvasTexture, LinearFilter, SRGBColorSpace, type Texture } from "three";
import { renderBackgroundToCanvas } from "./backgroundTexture";

type Props = {
  background: Background;
  assets: RenderAssets;
  width: number;
  height: number;
};

/**
 * Large plane sitting deep behind the device, showing the scene's background
 * (gradient / shader / image). Re-rasterized whenever the background spec
 * changes, then bumped into a CanvasTexture on the GPU.
 */
export default function BackgroundPlane({ background, assets, width, height }: Props) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let local: Texture | null = null;
    (async () => {
      try {
        const canvas = await renderBackgroundToCanvas(background, 1024, 1024, assets);
        if (cancelled) return;
        local = new CanvasTexture(canvas);
        local.colorSpace = SRGBColorSpace;
        local.minFilter = LinearFilter;
        local.magFilter = LinearFilter;
        setTexture(local);
      } catch (err) {
        if (!cancelled) console.warn("Background texture build failed:", err);
      }
    })();
    return () => {
      cancelled = true;
      if (local) local.dispose();
    };
  }, [background, assets]);

  // Plane size in world units — large enough to fill the camera view at our
  // preset distances but not so large that it bleeds into shadow plane geom.
  const planeW = Math.max(6, (width / Math.max(1, height)) * 5);
  const planeH = 5;

  return (
    <mesh position={[0, 0, -2.5]} receiveShadow={false}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial map={texture ?? undefined} color={texture ? 0xffffff : 0x111111} />
    </mesh>
  );
}
