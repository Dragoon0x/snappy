import type { RenderAssets } from "@/lib/render/types";
import type { Document } from "@/types/document";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, type Group, LinearFilter, SRGBColorSpace } from "three";
import { renderDeviceToCanvas } from "./deviceTexture";

type Props = {
  doc: Document;
  assets: RenderAssets;
  /** Size in world units. The plane auto-fits within a 1.4 × 1.0 box. */
  maxSize?: number;
};

/**
 * Renders the composed screenshot (screenshot + frame + shadow) onto a single
 * textured plane. We treat the whole composition as a flat card since the
 * frame already bakes the right chrome; the 3D magic comes from tilting + env
 * reflection on the device's specular clearcoat overlay.
 */
export default function DeviceMesh({ doc, assets, maxSize = 1.4 }: Props) {
  const groupRef = useRef<Group | null>(null);

  const { texture, aspect } = useMemo(() => {
    const r = renderDeviceToCanvas(doc, assets, 2048);
    const tex = new CanvasTexture(r.canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 16;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.needsUpdate = true;
    return { texture: tex, aspect: r.aspect };
  }, [doc, assets]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const planeW = aspect >= 1 ? maxSize : maxSize * aspect;
  const planeH = aspect >= 1 ? maxSize / aspect : maxSize;

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[planeW, planeH]} />
        <meshPhysicalMaterial
          map={texture}
          transparent
          roughness={0.28}
          metalness={0.05}
          clearcoat={0.85}
          clearcoatRoughness={0.08}
          envMapIntensity={0.75}
        />
      </mesh>
    </group>
  );
}
