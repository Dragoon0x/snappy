import type { GradientStop } from "@/types/document";

export type GradientPoints = {
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/**
 * Compute start/end points for a CSS-like linear gradient of a given angle (degrees)
 * over a rectangle of the given width/height, using CSS's definition where
 * the angle is the direction of the gradient line and 0deg is "to top".
 */
export function linearGradientPoints(
  width: number,
  height: number,
  angleDeg: number,
): GradientPoints {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const halfLen = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  return {
    start: { x: cx - dx * halfLen, y: cy - dy * halfLen },
    end: { x: cx + dx * halfLen, y: cy + dy * halfLen },
  };
}

export function flattenGradientStops(stops: GradientStop[]): Array<number | string> {
  const out: Array<number | string> = [];
  for (const s of stops) {
    out.push(s.offset, s.color);
  }
  return out;
}
