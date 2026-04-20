import { applyTemplate, templates } from "@/lib/presets/templates";
import { defaultScreenshot } from "@/types/document";
import { describe, expect, it } from "vitest";

describe("applyTemplate", () => {
  it("every template has a valid id, canvas size, preview, and frame id", () => {
    for (const t of templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.canvas.width).toBeGreaterThan(200);
      expect(t.canvas.height).toBeGreaterThan(200);
      expect(t.preview).toMatch(/gradient|#/);
      expect(typeof t.frame.id).toBe("string");
    }
  });

  it("merges current frame controls with template's frame patch", () => {
    const current = {
      frame: {
        id: "macos-window" as const,
        variant: "light" as const,
        controls: { tabTitle: "Custom", url: "example.com", showButtons: true },
      },
      screenshot: defaultScreenshot(),
    };
    const tpl = templates.find((t) => t.id === "twitter-hero");
    expect(tpl).toBeDefined();
    if (!tpl) return;
    const result = applyTemplate(tpl, current);
    // Template forces frame id + variant, but preserves unspecified control fields.
    expect(result.frame.id).toBe(tpl.frame.id);
    expect(result.frame.variant).toBe(tpl.frame.variant ?? current.frame.variant);
    expect(result.frame.controls.tabTitle).toBe("Custom");
    expect(result.frame.controls.url).toBe("example.com");
  });

  it("produces a well-formed Screenshot shadow with all fields set", () => {
    const current = {
      frame: defaultScreenshot().frame,
      screenshot: defaultScreenshot(),
    };
    const tpl = templates[0]!;
    const r = applyTemplate(tpl, current);
    expect(r.screenshot.shadow).toHaveProperty("enabled");
    expect(r.screenshot.shadow).toHaveProperty("color");
    expect(r.screenshot.shadow).toHaveProperty("blur");
    expect(r.screenshot.shadow).toHaveProperty("offsetX");
    expect(r.screenshot.shadow).toHaveProperty("offsetY");
    expect(r.screenshot.shadow).toHaveProperty("spread");
    expect(r.screenshot.shadow).toHaveProperty("opacity");
  });
});
