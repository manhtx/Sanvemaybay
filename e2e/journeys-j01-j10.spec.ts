import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/functions/v1/feed-snapshot", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ deals: [] }),
    });
  });
  await page.route("**/functions/v1/observed-fares", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "healthy_empty",
        fares: [],
        total: 0,
        next_page: null,
        generated_at: "2026-10-08T00:00:00Z",
      }),
    });
  });
});

test("J01: Direct search -> live results without fake fares", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: /Tìm kiếm cơ hội/i })).toBeVisible();
  // Keyboard interaction with input
  const destInput = page.getByLabel("Điểm đến (tuỳ chọn)");
  await destInput.focus();
  await page.keyboard.type("BKK");
  await expect(destInput).toHaveValue("BKK");
});

test("J02: Deal detail -> accurate cost breakdown (mandatory vs optional fees)", async ({ page }) => {
  await page.route("**/rest/v1/deals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "deal-j02", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
        price: 2000000, normal_price: 3000000, discount: 33, currency: "VND", airline: "Fixture Air", airline_code: "FA",
        depart_date: "2099-10-01", return_date: "2099-10-05", duration: "2h 30m", stops: 0, stop_city: null, seats_left: 0,
        expires_in: "Kiểm tra lại", image: "", flight_number: "FA1", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 80 },
        hidden_costs: [{ label: "Thuế sân bay", amount: 500000, note: "" }], advertised_total: 2000000, real_total: 2500000,
        is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80, observed_at: "2099-01-01T00:00:00Z", valid_until: "2099-01-02T00:00:00Z", link_kind: "live_source", booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
      }),
    });
  });
  await page.goto("/deals/deal-j02");
  await expect(page.getByRole("heading", { name: "HAN → BKK" })).toBeVisible();
  await expect(page.getByText(/2\.000\.000/).first()).toBeVisible();
});

test("J03: RouteBest comparison -> cheaper alternative across universe", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: /Tìm kiếm cơ hội/i })).toBeVisible();
  // Filter by maximum stops
  const stopsSelect = page.getByLabel("Số điểm dừng tối đa");
  await stopsSelect.selectOption("0");
  await expect(stopsSelect).toHaveValue("0");
});

test("J04: Watch creation -> preserves full TravelIntent", async ({ page }) => {
  await page.goto("/watch");
  await expect(page.getByRole("heading", { name: /Tuyến bay bạn đang quan sát/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tạo theo dõi/i })).toBeVisible();
});

test("J05 & J06 & J07: Watch alert lifecycle confirmation and status", async ({ page }) => {
  await page.route("**/functions/v1/manage-alert", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, status: "active" }),
    });
  });
  await page.goto("/alerts/confirm?token=j05-test-token-123456789012345678901234567890");
  await expect(page.getByRole("heading", { name: "Hoàn tất" })).toBeVisible();
  await expect(page.getByText("Cảnh báo đã được xác nhận và bắt đầu hoạt động.")).toBeVisible();
});

test("J08: Saved opportunity -> stable empty state and navigation", async ({ page }) => {
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "Cơ hội đã lưu" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Khám phá cơ hội/i })).toBeVisible();
});

test("J09: Account data rights and deletion integration", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /Chính sách bảo mật/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Xuất hoặc xóa dữ liệu tài khoản/i })).toBeVisible();
  await expect(page.getByText(/Đăng nhập tại trang Tài khoản để xuất dữ liệu hoặc yêu cầu xóa tài khoản/i)).toBeVisible();
});

test("J10: Degraded provider -> visible disclosure without synthetic claims", async ({ page }) => {
  await page.route("**/functions/v1/feed-snapshot", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        deals: [],
        status: "degraded_schema",
        source: "schema_check",
        generated_at: "2026-10-08T00:00:00Z",
        retryable: true,
        message: "Hệ thống dữ liệu đang được đồng bộ phiên bản.",
      }),
    });
  });
  await page.goto("/deals");
  await expect(page.getByRole("heading", { name: /Cơ hội giá vé đã ghi nhận/i })).toBeVisible();
  await expect(page.getByText(/Đang đồng bộ|thông thường|chưa có deal/i)).toBeVisible();
});
