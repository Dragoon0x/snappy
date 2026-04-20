import type { ThreePreset } from "@/types/document";

/**
 * Each preset is a suggestion for camera position + target + FOV. Manual tilt
 * from the ThreeConfig is applied as an offset to the device mesh, so the
 * user can fine-tune on top of any preset.
 */
export type CameraPreset = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** Pivot tilt applied to the device group for this preset (degrees). */
  deviceTilt: [number, number, number];
};

export const cameraPresets: Record<ThreePreset, CameraPreset> = {
  hero: {
    position: [0, 0.4, 2.2],
    target: [0, 0, 0],
    fov: 30,
    deviceTilt: [-6, 0, 0],
  },
  isometric: {
    position: [1.4, 1.2, 1.6],
    target: [0, 0, 0],
    fov: 24,
    deviceTilt: [-18, 22, 0],
  },
  floating: {
    position: [0.5, 1.0, 2.0],
    target: [0, -0.05, 0],
    fov: 28,
    deviceTilt: [-10, 10, 0],
  },
  angled: {
    position: [1.1, 0.2, 1.8],
    target: [0, 0, 0],
    fov: 32,
    deviceTilt: [-3, -16, 0],
  },
};

export const presetOrder: ThreePreset[] = ["hero", "floating", "angled", "isometric"];
