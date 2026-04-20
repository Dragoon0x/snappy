import { colorWithAlpha, linearGradientPoints, parseColor } from "@/lib/render/util";
import { describe, expect, it } from "vitest";

describe("parseColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseColor("#ff8040")).toEqual({ r: 255, g: 128, b: 64, a: 1 });
  });

  it("parses 8-digit hex with alpha", () => {
    const c = parseColor("#ff804080");
    expect(c.r).toBe(255);
    expect(c.g).toBe(128);
    expect(c.b).toBe(64);
    expect(c.a).toBeCloseTo(0x80 / 255, 2);
  });

  it("parses 3-digit hex", () => {
    expect(parseColor("#f80")).toEqual({ r: 255, g: 136, b: 0, a: 1 });
  });

  it("parses rgba()", () => {
    const c = parseColor("rgba(255, 128, 64, 0.5)");
    expect(c.r).toBe(255);
    expect(c.g).toBe(128);
    expect(c.b).toBe(64);
    expect(c.a).toBe(0.5);
  });

  it("parses rgb() without alpha", () => {
    expect(parseColor("rgb(1, 2, 3)")).toEqual({ r: 1, g: 2, b: 3, a: 1 });
  });

  it("falls back to black on unrecognized input", () => {
    expect(parseColor("not a color")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });
});

describe("colorWithAlpha", () => {
  it("composes source alpha with multiplier", () => {
    expect(colorWithAlpha("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.500)");
    expect(colorWithAlpha("rgba(0, 0, 0, 0.4)", 0.5)).toBe("rgba(0, 0, 0, 0.200)");
  });
});

describe("linearGradientPoints", () => {
  it("produces top→bottom points at angle 180", () => {
    const pts = linearGradientPoints(100, 100, 180);
    expect(pts.x0).toBeCloseTo(50, 5);
    expect(pts.y0).toBeCloseTo(0, 5);
    expect(pts.x1).toBeCloseTo(50, 5);
    expect(pts.y1).toBeCloseTo(100, 5);
  });

  it("produces bottom→top points at angle 0", () => {
    const pts = linearGradientPoints(100, 100, 0);
    expect(pts.x0).toBeCloseTo(50, 5);
    expect(pts.y0).toBeCloseTo(100, 5);
    expect(pts.x1).toBeCloseTo(50, 5);
    expect(pts.y1).toBeCloseTo(0, 5);
  });

  it("produces left→right points at angle 90", () => {
    const pts = linearGradientPoints(200, 100, 90);
    expect(pts.x0).toBeCloseTo(0, 5);
    expect(pts.x1).toBeCloseTo(200, 5);
  });
});
