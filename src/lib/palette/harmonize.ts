import type { Background, GradientStop } from "@/types/document";
import type { ExtractedPalette } from "./extract";

/**
 * Convert a rank-ordered palette into a background that harmonises with the
 * screenshot. For a saturated 3-colour palette, produces a linear gradient.
 * Falls back to a 2-colour gradient if fewer salient colours are found.
 */
export function harmoniseToBackground(colors: ExtractedPalette[]): Background {
  if (colors.length === 0) {
    return { kind: "solid", color: "#111111" };
  }
  if (colors.length === 1) {
    return {
      kind: "linearGradient",
      angle: 135,
      stops: [
        { color: colors[0]!.hex, offset: 0 },
        { color: shift(colors[0]!.hex, -0.12), offset: 1 },
      ],
    };
  }
  // Pick 3 most-different colours by weight and approximate hue spread.
  const picked = colors.slice(0, Math.min(3, colors.length));
  const stops: GradientStop[] = picked.map((c, i) => ({
    color: c.hex,
    offset: picked.length === 1 ? 0 : i / (picked.length - 1),
  }));
  return { kind: "linearGradient", angle: 135, stops };
}

/**
 * Shift a hex colour's lightness by the given delta (−1 to 1). Used to
 * synthesise a second stop from a single dominant colour.
 */
function shift(hex: string, delta: number): string {
  const m = hex.replace("#", "");
  const r = Number.parseInt(m.slice(0, 2), 16);
  const g = Number.parseInt(m.slice(2, 4), 16);
  const b = Number.parseInt(m.slice(4, 6), 16);
  const f = (n: number) => {
    const out = Math.round(n + delta * 255);
    return Math.max(0, Math.min(255, out)).toString(16).padStart(2, "0");
  };
  return `#${f(r)}${f(g)}${f(b)}`;
}
