import { defineConfig, devices } from "@playwright/test";

/**
 * Two servers over the same built `dist/`:
 * - 4321 `astro preview` for the page routes;
 * - 8787 `wrangler dev` for behaviour only the Workers asset handler applies (`not_found_handling`).
 * Commands are bare bins: Playwright runs from the package script, where pnpm puts `node_modules/.bin`
 * on PATH. Readiness polls a static public file so it never depends on the pages under test.
 */
const READY_PATH = (port: string) =>
  `http://localhost:${port}/resume/Garrett_Manley_Resume_ATS.pdf`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4321" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "astro preview --port 4321",
      url: READY_PATH("4321"),
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "wrangler dev --port 8787",
      url: READY_PATH("8787"),
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: "false" },
      timeout: 120_000,
    },
  ],
});
