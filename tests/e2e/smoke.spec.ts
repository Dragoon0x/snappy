import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, waitForHook } from "./fixtures";

test("the app boots with the editor and zero console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await waitForHook(page);

  // Topbar, command button, templates button, export button visible.
  await expect(page.locator("header").getByText("Snappy")).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: /Templates/ })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: /Commands/ })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: /Export/ })).toBeVisible();

  // Background panel with gradient presets by default.
  await expect(page.getByText("PRESETS").first()).toBeVisible();

  // Annotation toolbar visible.
  await expect(page.getByTitle(/^Select/)).toBeVisible();
  await expect(page.getByTitle(/^Blur mask/)).toBeVisible();

  await expectNoConsoleErrors(page, errors);
});
