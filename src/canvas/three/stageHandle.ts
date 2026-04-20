/**
 * Module-level handle to the currently-mounted r3f canvas. Used by the
 * export pipeline to read pixels when the document is in 3D mode.
 * Written by ThreeStage on mount/unmount.
 */
let current: HTMLCanvasElement | null = null;

export function setThreeCanvas(el: HTMLCanvasElement | null): void {
  current = el;
}

export function getThreeCanvas(): HTMLCanvasElement | null {
  return current;
}
