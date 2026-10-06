import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1207x861", width: 1207, height: 861 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const SCREENS = [
  { name: "home", path: "/" },
  { name: "search", path: "/search" },
  { name: "deals", path: "/deals" },
  { name: "watch", path: "/watch" },
  { name: "saved", path: "/saved" },
  { name: "auth", path: "/auth" },
  { name: "opportunity", path: "/deals/sample-opp" },
];

async function main() {
  const outputDir = path.resolve(process.cwd(), "docs/convergence/screenshots");
  await fs.mkdir(outputDir, { recursive: true });

  const port = 4173;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Start vite preview server
  console.log("Building application for preview...");
  const buildProc = spawn("npm", ["run", "build"], { stdio: "inherit" });
  await new Promise((resolve, reject) => {
    buildProc.on("close", (code) => (code === 0 ? resolve() : reject(new Error("Build failed"))));
  });

  console.log("Starting preview server on port", port);
  const serverProc = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    stdio: "inherit",
  });

  // Wait for server ready
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!serverReady) {
    serverProc.kill();
    throw new Error("Preview server failed to start");
  }

  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      console.log(`Capturing viewports at ${vp.width}x${vp.height} (${vp.name})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      // Route mocks for deterministic presentation
      await context.route("**/functions/v1/feed-snapshot", async (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            deals: [
              {
                id: "sample-opp",
                from: "Hà Nội",
                from_code: "HAN",
                to: "Bangkok",
                to_code: "BKK",
                country: "Thái Lan",
                region: "asia",
                price: 2150000,
                normal_price: 3200000,
                discount: 33,
                currency: "VND",
                airline: "Vietnam Airlines",
                airline_code: "VN",
                depart_date: "2026-11-15",
                return_date: "2026-11-20",
                duration: "2h 05m",
                stops: 0,
                deal_score: 88,
                confidence: 0.85,
                observed_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
                link_kind: "live_source",
                booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
                ai_reasoning: "Giá quan sát thấp hơn 33% so với trung vị lịch sử của tuyến HAN-BKK.",
              },
            ],
            status: "healthy",
            generated_at: new Date().toISOString(),
          }),
        });
      });

      await context.route("**/functions/v1/observed-fares", async (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "healthy",
            fares: [
              {
                id: "sample-opp",
                origin: "Hà Nội",
                origin_code: "HAN",
                destination: "Bangkok",
                destination_code: "BKK",
                country: "Thái Lan",
                region: "asia",
                price: 2150000,
                baseline_price: 3200000,
                discount_percent: 33,
                currency: "VND",
                airline: "Vietnam Airlines",
                airline_code: "VN",
                date: "2026-11-15",
                return_date: "2026-11-20",
                duration: "2h 05m",
                stops: 0,
                deal_score: 88,
                confidence_percent: 85,
                timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
                booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
                source: "fast_flights_google",
                link_kind: "indicative",
                freshness_minutes: 22,
              },
              {
                id: "sample-opp-2",
                origin: "Hà Nội",
                origin_code: "HAN",
                destination: "Kuala Lumpur",
                destination_code: "KUL",
                country: "Malaysia",
                region: "asia",
                price: 4265000,
                baseline_price: 5200000,
                discount_percent: 18,
                currency: "VND",
                airline: "AirAsia",
                airline_code: "AK",
                date: "2026-12-12",
                return_date: "2026-12-17",
                duration: "3h 15m",
                stops: 0,
                deal_score: 82,
                confidence_percent: 80,
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                booking_url: "https://www.google.com/travel/flights?q=HAN-KUL",
                source: "fast_flights_google",
                link_kind: "indicative",
                freshness_minutes: 15,
              },
            ],
            total: 2,
            next_page: null,
            generated_at: new Date().toISOString(),
          }),
        });
      });

      await context.route("**/rest/v1/deals**", async (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "sample-opp",
            from: "Hà Nội",
            from_code: "HAN",
            to: "Bangkok",
            to_code: "BKK",
            country: "Thái Lan",
            region: "asia",
            price: 2150000,
            normal_price: 3200000,
            discount: 33,
            currency: "VND",
            airline: "Vietnam Airlines",
            airline_code: "VN",
            depart_date: "2026-11-15",
            return_date: "2026-11-20",
            duration: "2h 05m",
            stops: 0,
            deal_score: 88,
            confidence: 0.85,
            observed_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
            link_kind: "live_source",
            booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
            ai_reasoning: "Giá quan sát thấp hơn 33% so với trung vị lịch sử của tuyến HAN-BKK.",
            hidden_costs: [{ label: "Thuế & phí sân bay", amount: 0, note: "Đã bao gồm trong giá vé" }],
            advertised_total: 2150000,
            real_total: 2150000,
          }),
        });
      });

      const page = await context.newPage();

      for (const screen of SCREENS) {
        await page.goto(`${baseUrl}${screen.path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        const fileName = `${screen.name}_${vp.name}.png`;
        const filePath = path.join(outputDir, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved ${fileName}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
    serverProc.kill();
  }

  console.log("Visual acceptance screenshot capture complete!");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
