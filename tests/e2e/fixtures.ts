import { type Page, expect } from "@playwright/test";

/**
 * The modifier key the app treats as the "Mod" hotkey, mirroring the
 * platform detection in src/lib/utils.ts. Playwright doesn't auto-switch.
 */
export const MOD = process.platform === "darwin" ? "Meta" : "Control";

/**
 * Wait for the Snappy dev hook to be installed. This confirms the app booted,
 * all four Zustand stores are in memory, and the test can drive them.
 */
export async function waitForHook(page: Page): Promise<void> {
  await page.waitForFunction(
    () => typeof (window as { __SNAPPY__?: unknown }).__SNAPPY__ !== "undefined",
    undefined,
    { timeout: 10_000 },
  );
  // Dismiss the onboarding modal so it doesn't intercept pointer events.
  await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: {
          settings: { getState: () => { setOnboardingDone: (v: boolean) => void } };
          editor: { getState: () => { closeOnboarding: () => void } };
        };
      }
    ).__SNAPPY__;
    hook.settings.getState().setOnboardingDone(true);
    hook.editor.getState().closeOnboarding();
  });
}

/** Reset the active document to a predictable empty state. */
export async function resetDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    const hook = (
      window as unknown as { __SNAPPY__: { document: { getState: () => { reset: () => void } } } }
    ).__SNAPPY__;
    hook.document.getState().reset();
  });
}

/**
 * Install a synthetic screenshot as if the user dropped it. Returns the assetId
 * the store attached. The synthetic image is a simple gradient so tests can
 * reason about its pixels.
 */
export async function seedScreenshot(page: Page, width = 1200, height = 800): Promise<string> {
  return await page.evaluate(
    async ({ width, height }) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#111824");
      g.addColorStop(1, "#3a6ea5");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px sans-serif";
      ctx.fillText("SAMPLE", 40, 80);
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
      const file = new File([blob], "sample.png", { type: "image/png" });
      const dt = new DataTransfer();
      dt.items.add(file);
      window.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
      await new Promise((r) => setTimeout(r, 400));
      const hook = (
        window as unknown as {
          __SNAPPY__: {
            document: { getState: () => { doc: { screenshot: { assetId: string | null } } } };
          };
        }
      ).__SNAPPY__;
      return hook.document.getState().doc.screenshot.assetId!;
    },
    { width, height },
  );
}

export async function getAnnotationCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: { document: { getState: () => { doc: { annotations: unknown[] } } } };
      }
    ).__SNAPPY__;
    return hook.document.getState().doc.annotations.length;
  });
}

export async function expectNoConsoleErrors(page: Page, errors: string[]): Promise<void> {
  // Filter out known noisy warnings that are not actionable.
  const filtered = errors.filter(
    (e) => !e.includes("React Router Future Flag") && !e.includes("Download the React DevTools"),
  );
  expect(filtered, `console errors: ${filtered.join("\n")}`).toHaveLength(0);
}
