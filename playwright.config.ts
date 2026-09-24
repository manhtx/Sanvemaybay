import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL: "http://127.0.0.1:4189",
    trace: "on-first-retry",
  },
  webServer: {
    command: "VITE_SUPABASE_URL=https://e2e-fixture.supabase.co VITE_SUPABASE_ANON_KEY=e2e-fixture-anon-key VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA VITE_RUM_SAMPLE_RATE=0 npm run build && npm run preview -- --host 127.0.0.1 --port 4189 --strictPort",
    url: "http://127.0.0.1:4189/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
