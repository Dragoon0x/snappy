import { flattenGradientStops, linearGradientPoints } from "@/canvas/gradientMath";
import { describe, expect, it } from "vitest";

describe("canvas linearGradientPoints", () => {
  it("is symmetric across the center for opposing angles", () => {
    const a = linearGradientPoints(400, 200, 45);
    const b = linearGradientPoints(400, 200, 225);
    expect(a.start.x).toBeCloseTo(b.end.x, 4);
    expect(a.start.y).toBeCloseTo(b.end.y, 4);
    expect(a.end.x).toBeCloseTo(b.start.x, 4);
    expect(a.end.y).toBeCloseTo(b.start.y, 4);
  });
});

describe("flattenGradientStops", () => {
  it("interleaves offsets and colors as Konva expects", () => {
    const stops = [
      { color: "#ff0000", offset: 0 },
      { color: "#00ff00", offset: 0.5 },
      { color: "#0000ff", offset: 1 },
    ];
    expect(flattenGradientStops(stops)).toEqual([0, "#ff0000", 0.5, "#00ff00", 1, "#0000ff"]);
  });
});
