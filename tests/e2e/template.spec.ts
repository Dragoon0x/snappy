import { expect, test } from "@playwright/test";
import { resetDocument, waitForHook } from "./fixtures";

test("opening Templates and applying X/Twitter post changes the canvas size", async ({ page }) => {
  await page.goto("/");
  await waitForHook(page);
  await resetDocument(page);

  await page.getByRole("button", { name: /Templates/ }).click();
  await expect(page.getByText("X / Twitter post")).toBeVisible();
  await page.getByText("X / Twitter post").click();

  const canvas = await page.evaluate(() => {
    const hook = (
      window as unknown as {
        __SNAPPY__: {
          document: { getState: () => { doc: { canvas: { width: number; height: number } } } };
        };
      }
    ).__SNAPPY__;
    return hook.document.getState().doc.canvas;
  });
  expect(canvas.width).toBe(1600);
  expect(canvas.height).toBe(900);
});
