import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 568, name: "iPhone SE 1st gen" },
  { width: 360, height: 800, name: "Android compact" },
  { width: 390, height: 844, name: "iPhone 12/13/14" },
  { width: 430, height: 932, name: "iPhone 14/15 Pro Max" },
  { width: 768, height: 1024, name: "iPad portrait" },
  { width: 1024, height: 768, name: "iPad landscape / small laptop" },
  { width: 1207, height: 861, name: "User incident viewport (1207x861)" },
  { width: 1280, height: 800, name: "Standard 720p / 13-inch laptop" },
  { width: 1366, height: 768, name: "Common laptop" },
  { width: 1440, height: 900, name: "MacBook Air/Pro default" },
  { width: 1920, height: 1080, name: "Full HD 1080p desktop" },
];

test.describe("Responsive viewport & overflow verification", () => {
  for (const vp of VIEWPORTS) {
    test(`deals page renders cleanly without horizontal overflow at ${vp.width}x${vp.height} (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const fare = (id: string, price: number, discount: number, score: number) => ({
        id,
        origin: "Hà Nội",
        origin_code: "HAN",
        destination: "TP.HCM",
        destination_code: "SGN",
        country: "Việt Nam",
        region: "domestic",
        price,
        baseline_price: 4_000_000,
        discount_percent: discount,
        currency: "VND",
        airline: "Vietjet Air",
        airline_code: "VJ",
        date: "2099-10-01",
        return_date: "2099-10-05",
        duration: "2h 10m",
        stops: 0,
        booking_url: "https://www.google.com/travel/flights?q=HAN-SGN",
        source: "fast_flights_google",
        link_kind: "indicative",
        timestamp: "2099-01-01T00:00:00Z",
        sample_size: 15,
        confidence_percent: 95,
        confidence_level: "high",
        percentile: 90,
        deal_score: score,
        deal_label: score >= 90 ? "Deal cực nóng" : "Giá đáng chú ý",
        freshness_minutes: 25,
      });

      await page.route("**/functions/v1/observed-fares", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "healthy",
            fares: [
              fare("f1", 1_850_000, 38, 93),
              fare("f2", 2_200_000, 26, 82),
              fare("f3", 2_800_000, 15, 68),
            ],
            total: 3,
            next_page: null,
            generated_at: "2099-01-01T00:00:00Z",
          }),
        });
      });

      await page.goto("/deals");

      // Verify page loaded
      await expect(page.getByRole("heading", { name: "Giá Vé Máy Bay Đang Giảm Mạnh" })).toBeVisible();

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1, // allow 1px subpixel tolerance
        };
      });

      expect(overflow.hasOverflow).toBeFalsy();

      // Check header branding
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("header").getByRole("link", { name: /Farely/ })).toBeVisible();

      // If desktop, verify desktop nav is present; if mobile, verify mobile menu button
      if (vp.width >= 1024) {
        await expect(page.locator("header").getByRole("link", { name: "Deal Nóng" })).toBeVisible();
      } else {
        await expect(page.locator("header").getByRole("button", { name: /Mở menu/ })).toBeVisible();
      }
    });
  }
});
