import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 5173);
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Dedicated Playwright config for marketing screenshot capture. Kept separate
 * from tests/e2e so CI doesn't pay the cost and local screenshot generation is
 * a one-line opt-in (`npm run screens`).
 */
export default defineConfig({
  testDir: "../tests/screens",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5173 --host 127.0.0.1",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
