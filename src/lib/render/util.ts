import type { Ctx2D } from "./types";

export function parseColor(input: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const s = input.trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = Number.parseInt(hex[0]! + hex[0]!, 16);
      const g = Number.parseInt(hex[1]! + hex[1]!, 16);
      const b = Number.parseInt(hex[2]! + hex[2]!, 16);
      const a = hex.length === 4 ? Number.parseInt(hex[3]! + hex[3]!, 16) / 255 : 1;
      return { r, g, b, a };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
  }
  const rgbaMatch = s.match(/rgba?\(([^)]+)\)/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1]!.split(",").map((p) => p.trim());
    const r = Number(parts[0] ?? 0);
    const g = Number(parts[1] ?? 0);
    const b = Number(parts[2] ?? 0);
    const a = parts.length > 3 ? Number(parts[3]) : 1;
    return { r, g, b, a: Number.isFinite(a) ? a : 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function colorWithAlpha(input: string, alpha: number): string {
  const c = parseColor(input);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${(c.a * alpha).toFixed(3)})`;
}

export function roundedRectPath(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number],
): void {
  const radii = typeof r === "number" ? [r, r, r, r] : r;
  const [tl, tr, br, bl] = radii;
  const rx = Math.min(Math.abs(w), Math.abs(h)) / 2;
  const t = Math.min(tl!, rx);
  const r2 = Math.min(tr!, rx);
  const b = Math.min(br!, rx);
  const l = Math.min(bl!, rx);

  ctx.beginPath();
  ctx.moveTo(x + t, y);
  ctx.lineTo(x + w - r2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
  ctx.lineTo(x + w, y + h - b);
  ctx.quadraticCurveTo(x + w, y + h, x + w - b, y + h);
  ctx.lineTo(x + l, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - l);
  ctx.lineTo(x, y + t);
  ctx.quadraticCurveTo(x, y, x + t, y);
  ctx.closePath();
}

/** CSS-like linear gradient angle to start/end coordinates on the rect. */
export function linearGradientPoints(
  width: number,
  height: number,
  angleDeg: number,
): { x0: number; y0: number; x1: number; y1: number } {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const halfLen = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  return {
    x0: cx - dx * halfLen,
    y0: cy - dy * halfLen,
    x1: cx + dx * halfLen,
    y1: cy + dy * halfLen,
  };
}

export function drawImageCover(
  ctx: Ctx2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function drawImageContain(
  ctx: Ctx2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}
