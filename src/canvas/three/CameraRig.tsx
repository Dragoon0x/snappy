import type { ThreeConfig } from "@/types/document";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { cameraPresets } from "./presets";

type Props = {
  three: ThreeConfig;
};

/**
 * Drives the default perspective camera toward the active preset target +
 * position with a damped lerp, so switching presets feels cinematic instead
 * of snappy.
 */
export default function CameraRig({ three }: Props) {
  const { camera } = useThree();
  const targetPos = useRef(new Vector3());
  const targetLook = useRef(new Vector3());
  const currentLook = useRef(new Vector3());

  useEffect(() => {
    const p = cameraPresets[three.preset];
    targetPos.current.set(
      p.position[0] * three.distance,
      p.position[1] * three.distance,
      p.position[2] * three.distance,
    );
    targetLook.current.set(p.target[0], p.target[1], p.target[2]);
    if ("fov" in camera) {
      (camera as { fov: number }).fov = p.fov;
      (camera as { updateProjectionMatrix: () => void }).updateProjectionMatrix();
    }
  }, [three.preset, three.distance, camera]);

  useFrame((_, dt) => {
    const lerp = Math.min(1, dt * 4);
    camera.position.lerp(targetPos.current, lerp);
    currentLook.current.lerp(targetLook.current, lerp);
    camera.lookAt(currentLook.current);
  });

  return null;
}
