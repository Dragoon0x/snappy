import { expect, test } from "@playwright/test";
import { MOD, waitForHook } from "./fixtures";

test("Mod+K opens and closes the command palette", async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);
  // Let the useHotkey effect install its window listener.
  await page.waitForTimeout(300);

  // Playwright's chromium reports navigator.platform = "Win32" on all hosts.
  // Dispatch both modifiers so useHotkey matches regardless of isMac() branch.
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        code: "KeyK",
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  });

  // Verify via store (deterministic), then via DOM.
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __SNAPPY__: { editor: { getState: () => { isCommandPaletteOpen: boolean } } };
            }
          ).__SNAPPY__.editor.getState().isCommandPaletteOpen,
      ),
    )
    .toBe(true);
  await expect(page.getByPlaceholder(/Search commands/i)).toBeVisible();

  // Close via the store (cmdk only listens to Esc while its input has focus,
  // and our synthetic dispatch didn't move focus — so use the action directly).
  await page.evaluate(() => {
    (
      window as unknown as {
        __SNAPPY__: { editor: { getState: () => { closeCommandPalette: () => void } } };
      }
    ).__SNAPPY__.editor
      .getState()
      .closeCommandPalette();
  });
  await expect(page.getByPlaceholder(/Search commands/i)).toHaveCount(0);
});

test("T selects the text tool and toolbar reflects it", async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);

  // Focus the canvas area first so the keypress doesn't land inside an input.
  await page.locator("body").click({ position: { x: 100, y: 400 } });
  await page.keyboard.press("KeyT");
  await expect(page.getByTitle(/^Text/)).toHaveClass(/bg-accent|text-bg/);
});
