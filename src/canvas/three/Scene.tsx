import type { RenderAssets } from "@/lib/render/types";
import type { Document } from "@/types/document";
import { ContactShadows, Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
import BackgroundPlane from "./BackgroundPlane";
import CameraRig from "./CameraRig";
import DeviceMesh from "./DeviceMesh";
import { cameraPresets } from "./presets";

type Props = {
  doc: Document;
  assets: RenderAssets;
};

export default function Scene({ doc, assets }: Props) {
  const three = doc.three;
  const deviceRef = useRef<Group | null>(null);

  const targetTilt = useMemo(() => {
    const p = cameraPresets[three.preset];
    return {
      x: MathUtils.degToRad(p.deviceTilt[0] + three.tiltX),
      y: MathUtils.degToRad(p.deviceTilt[1] + three.tiltY),
      z: MathUtils.degToRad(p.deviceTilt[2] + three.tiltZ),
    };
  }, [three.preset, three.tiltX, three.tiltY, three.tiltZ]);

  // Smoothly lerp the device group toward the target tilt + elevation each
  // frame for cinematic preset transitions.
  useFrame((_, dt) => {
    const node = deviceRef.current;
    if (!node) return;
    const k = Math.min(1, dt * 6);
    node.rotation.x = MathUtils.lerp(node.rotation.x, targetTilt.x, k);
    node.rotation.y = MathUtils.lerp(node.rotation.y, targetTilt.y, k);
    node.rotation.z = MathUtils.lerp(node.rotation.z, targetTilt.z, k);
    node.position.y = MathUtils.lerp(node.position.y, three.elevation, k);
  });

  return (
    <>
      <CameraRig three={three} />
      <BackgroundPlane
        background={doc.background}
        assets={assets}
        width={doc.canvas.width}
        height={doc.canvas.height}
      />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        intensity={0.9}
        position={[2.5, 4, 3]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0002}
      />
      <directionalLight intensity={0.25} position={[-2, 1, -1]} color={0xbfcaff} />
      <Environment preset={three.environment} />

      <group ref={deviceRef} position={[0, 0, 0]}>
        <DeviceMesh doc={doc} assets={assets} />
      </group>

      <ContactShadows
        position={[0, -0.55, 0]}
        opacity={three.shadowStrength}
        scale={6}
        blur={2.4}
        far={2}
        resolution={1024}
      />
    </>
  );
}
