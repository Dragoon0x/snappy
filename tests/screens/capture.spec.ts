import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";
import { waitForHook } from "../e2e/fixtures";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "..", "docs", "screenshots");

async function buildDemoImage(
  page: ReturnType<Parameters<Parameters<typeof test>[1]>[0]["page"]["evaluate"]> extends Promise<
    infer _
  >
    ? never
    : never,
  label: string,
): Promise<void> {}

async function dropDemo(page: import("@playwright/test").Page, label: string, subtitle: string) {
  await page.evaluate(
    async ({ label, subtitle }) => {
      const c = document.createElement("canvas");
      c.width = 1600;
      c.height = 1000;
      const ctx = c.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#111824");
      g.addColorStop(1, "#3a6ea5");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 120px Inter, sans-serif";
      ctx.fillText(label, 120, 540);
      ctx.font = "500 56px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(subtitle, 120, 620);
      ctx.font = "40px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("snappy.app", 120, 690);
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
      const file = new File([blob], "sample.png", { type: "image/png" });
      const dt = new DataTransfer();
      dt.items.add(file);
      window.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
      await new Promise((r) => setTimeout(r, 400));
    },
    { label, subtitle },
  );
}

async function applyShader(
  page: import("@playwright/test").Page,
  presetId: string,
  params: Record<string, string | number>,
  seed: number,
) {
  await page.evaluate(
    ({ presetId, params, seed }) => {
      const hook = (
        window as unknown as {
          __SNAPPY__: {
            document: { getState: () => { setBackground: (bg: unknown) => void } };
          };
        }
      ).__SNAPPY__;
      hook.document.getState().setBackground({
        kind: "shader",
        presetId,
        params,
        seed,
      });
    },
    { presetId, params, seed },
  );
}

async function applyTemplate(page: import("@playwright/test").Page, id: string) {
  await page.evaluate((templateId) => {
    const hook = (
      window as unknown as {
        __SNAPPY__: {
          document: {
            getState: () => { apply: (m: (d: unknown) => void) => void; doc: unknown };
          };
        };
      }
    ).__SNAPPY__;
    // Use the command directly to apply the template to the current doc
    const w = window as unknown as { __SNAPPY_APPLY_TEMPLATE__?: (id: string) => void };
    if (w.__SNAPPY_APPLY_TEMPLATE__) w.__SNAPPY_APPLY_TEMPLATE__(templateId);
  }, id);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);
  // Dismiss onboarding so it doesn't overlay screenshots
  await page.evaluate(() => {
    const w = window as unknown as {
      __SNAPPY__: {
        settings: { getState: () => { setOnboardingDone: (v: boolean) => void } };
        editor: { getState: () => { closeOnboarding: () => void } };
      };
    };
    w.__SNAPPY__.settings.getState().setOnboardingDone(true);
    w.__SNAPPY__.editor.getState().closeOnboarding();
  });
});

test("01 hero — cosmic aurora 2D", async ({ page }) => {
  await dropDemo(page, "Snappy", "beautiful screenshots, instantly");
  await applyShader(
    page,
    "aurora-cosmic",
    { u_c1: "#1a0933", u_c2: "#6e3cbc", u_c3: "#ff6ec7", u_intensity: 1.2, u_warp: 0.9 },
    42,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "01-hero.png"), fullPage: false });
});

test("02 sunset mesh 2D", async ({ page }) => {
  await dropDemo(page, "Dribbble shot", "mesh gradient backdrop");
  await applyShader(
    page,
    "mesh-sunset",
    { u_c1: "#ff6a88", u_c2: "#feb47b", u_c3: "#8f94fb", u_c4: "#43e97b", u_blend: 0.6 },
    7,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "02-mesh.png") });
});

test("03 3D mode aurora", async ({ page }) => {
  await dropDemo(page, "3D perspective", "real tilt + HDR reflections");
  await applyShader(
    page,
    "aurora-cosmic",
    { u_c1: "#0a0030", u_c2: "#5e26a6", u_c3: "#ff6ec7", u_intensity: 1.2, u_warp: 0.9 },
    12,
  );
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: { document: { getState: () => { setViewMode: (m: "2d" | "3d") => void } } };
      }
    ).__SNAPPY__;
    hook.document.getState().setViewMode("3d");
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, "03-three.png") });
});

test("04 command palette", async ({ page }) => {
  await dropDemo(page, "Command palette", "⌘K for everything");
  await applyShader(
    page,
    "dots-dark",
    { u_bg: "#0e0e12", u_dot: "#33333b", u_spacing: 48, u_dotSize: 0.08, u_fade: 0.55 },
    1,
  );
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: { editor: { getState: () => { openCommandPalette: () => void } } };
      }
    ).__SNAPPY__;
    hook.editor.getState().openCommandPalette();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "04-palette.png") });
});

test("05 templates modal", async ({ page }) => {
  await dropDemo(page, "Templates", "curated starting points");
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: { editor: { getState: () => { openTemplates: () => void } } };
      }
    ).__SNAPPY__;
    hook.editor.getState().openTemplates();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "05-templates.png") });
});

test("06 annotations + blur mask", async ({ page }) => {
  await dropDemo(page, "Redaction + arrows", "annotations layer");
  await applyShader(
    page,
    "aurora-night",
    { u_c1: "#0b1e3f", u_c2: "#2d6d9e", u_c3: "#5df2c2", u_intensity: 1.1, u_warp: 0.8 },
    3,
  );
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: { document: { getState: () => { addAnnotation: (a: unknown) => void } } };
      }
    ).__SNAPPY__;
    const add = hook.document.getState().addAnnotation;
    add({
      id: "a1",
      type: "arrow",
      space: "canvas",
      x: 120,
      y: 120,
      toX: 540,
      toY: 420,
      rotation: 0,
      opacity: 1,
      locked: false,
      color: "#ff3b5c",
      strokeWidth: 7,
      style: "straight",
    });
    add({
      id: "t1",
      type: "text",
      space: "canvas",
      x: 40,
      y: 60,
      rotation: 0,
      opacity: 1,
      locked: false,
      text: "Redacted",
      fontSize: 64,
      fontWeight: 800,
      color: "#ffd24a",
      align: "left",
      fontFamily: "Inter, system-ui, sans-serif",
    });
    add({
      id: "b1",
      type: "blur",
      space: "canvas",
      x: 500,
      y: 460,
      width: 580,
      height: 70,
      rotation: 0,
      opacity: 1,
      locked: false,
      cornerRadius: 6,
      pixelSize: 14,
    });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "06-annotations.png") });
});
