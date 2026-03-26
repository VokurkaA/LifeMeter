import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.BROWSER_REVIEW_PORT || 3100);
const host = process.env.BROWSER_REVIEW_HOST || "127.0.0.1";
const baseURL = process.env.BROWSER_REVIEW_BASE_URL || `http://${host}:${port}`;
const useManagedWebServer = process.env.BROWSER_REVIEW_SKIP_WEBSERVER !== "1";

export default defineConfig({
  testDir: "./e2e",
  outputDir: ".artifacts/browser-review/test-results",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "desktop-light",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1080 },
        colorScheme: "light",
      },
    },
    {
      name: "desktop-dark",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1080 },
        colorScheme: "dark",
      },
    },
    {
      name: "mobile-light",
      use: {
        ...devices["Pixel 7"],
        colorScheme: "light",
      },
    },
    {
      name: "mobile-dark",
      use: {
        ...devices["Pixel 7"],
        colorScheme: "dark",
      },
    },
  ],
  webServer: useManagedWebServer
    ? {
        command: `npm run build && npm run start -- --hostname ${host} --port ${port}`,
        url: baseURL,
        cwd: ".",
        reuseExistingServer: true,
        timeout: 240_000,
      }
    : undefined,
});
