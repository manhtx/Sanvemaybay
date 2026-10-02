import { expect, test } from "@playwright/test";

// Production reads the published snapshot first and only falls back to the
// deals table. Keep E2E fixtures deterministic by explicitly exercising that
// fallback unless a test opts into a feed-snapshot response.
test.beforeEach(async ({ page }) => {
  await page.route("**/functions/v1/feed-snapshot", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ deals: [] }),
    });
  });
  await page.route("**/functions/v1/observed-fares", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "healthy_empty", fares: [], total: 0, next_page: null, generated_at: "2026-08-19T00:00:00Z" }) });
  });
});

test("homepage renders the opportunity-first experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Không cần biết đi đâu. Chỉ cần biết khi nào rẻ." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem Deal Ngay" })).toHaveAttribute("href", "/deals");
  await expect(page.getByText("Deal Nóng Hôm Nay")).toBeVisible();
});

test("deals page distinguishes a degraded feed from healthy zero inventory", async ({ page }) => {
  await page.route("**/functions/v1/feed-snapshot", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        deals: [],
        status: "degraded_schema",
        source: "schema_check",
        generated_at: "2026-08-19T00:00:00Z",
        retryable: true,
        message: "Hệ thống dữ liệu đang được đồng bộ phiên bản.",
      }),
    });
  });
  await page.goto("/deals");
  await page.getByRole("tab", { name: /Deal live/ }).click();
  const alert = page.getByRole("alert", { name: "Trạng thái nguồn deal" });
  await expect(alert).toContainText("Nguồn deal đang cần được khôi phục");
  await expect(alert).toContainText("không hiển thị dữ liệu cũ");
  await expect(page.getByText("Hệ thống phát hiện 0 deal")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
});

test("deals page explains a healthy feed with no qualified live deals", async ({ page }) => {
  await page.route("**/functions/v1/feed-snapshot", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        deals: [], status: "healthy_empty", source: "live",
        generated_at: "2026-08-19T00:00:00Z", retryable: false,
        message: "Hiện chưa có deal live đạt tiêu chuẩn.",
      }),
    });
  });
  await page.goto("/deals");
  await page.getByRole("tab", { name: /Deal live/ }).click();
  const status = page.getByRole("status", { name: "Trạng thái nguồn deal" });
  await expect(status).toContainText("Chưa có deal live đạt chuẩn lúc này");
  await expect(status).toContainText("không hiển thị dữ liệu cũ");
  await expect(page.getByText("Deals đang có")).toHaveCount(0);
  await expect(page.getByText("Thử thay đổi bộ lọc")).toHaveCount(0);
});

test("homepage renders validated feed sections when deals exist", async ({ page }) => {
  await page.route("**/functions/v1/feed-snapshot", async (route) => {
    const deal = {
      id: "feed-fixture", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
      price: 2000000, normal_price: 3000000, discount: 33, currency: "VND", airline: "Fixture Air", airline_code: "FA",
      depart_date: "2099-10-01", return_date: "2099-10-05", duration: "2h 30m", stops: 0, stop_city: null, seats_left: 0,
      expires_in: "Kiểm tra lại", image: "", flight_number: "FA1", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 80 },
      hidden_costs: [], advertised_total: 2000000, real_total: 2000000, is_trending: true, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80,
      observed_at: "2099-01-01T00:00:00Z", valid_until: "2099-01-02T00:00:00Z", link_kind: "live_source", booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        deals: [deal], status: "healthy", source: "snapshot",
        generated_at: "2099-01-01T00:00:00Z", retryable: false,
        message: "Deal live đã được xác minh.",
      }),
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mới phát hiện" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Giảm giá lớn nhất" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đề xuất theo preference" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Điểm đến đang nổi bật" })).toBeVisible();
});

test("observed fares render the largest discount first with color-coded percentages", async ({ page }) => {
  const fare = (id: string, price: number, discount: number, score: number) => ({ id, origin: "Hà Nội", origin_code: "HAN", destination: "TP.HCM", destination_code: "SGN", country: "Việt Nam", region: "domestic", price, baseline_price: 4_000_000, discount_percent: discount, currency: "VND", airline: "Fixture Air", airline_code: "FA", date: "2099-10-01", return_date: "2099-10-05", duration: "2h", stops: 0, booking_url: "https://www.google.com/travel/flights?q=HAN-SGN", source: "fast_flights_google", link_kind: "indicative", timestamp: "2099-01-01T00:00:00Z", sample_size: 12, confidence_percent: 100, confidence_level: "high", percentile: 90, deal_score: score, deal_label: score >= 90 ? "Deal cực nóng" : "Giá đáng chú ý", freshness_minutes: 20 });
  await page.route("**/functions/v1/observed-fares", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "healthy", fares: [fare("red", 2_000_000, 35, 92), fare("yellow", 3_000_000, 20, 75), fare("green", 3_600_000, 10, 62)], total: 3, next_page: null, generated_at: "2099-01-01T00:00:00Z" }) });
  });
  await page.goto("/deals");
  await expect(page.getByRole("heading", { name: "Cơ Hội Vé Máy Bay Giá Tốt" })).toBeVisible();
  const badges = page.locator("text=/↓ (35|20|10)\\.0%/");
  await expect(badges).toHaveCount(3);
  await expect(page.getByText("↓ 35.0%")).toHaveClass(/bg-red-500/);
  await expect(page.getByText("↓ 20.0%")).toHaveClass(/bg-amber-400/);
  await expect(page.getByText("↓ 10.0%")).toHaveClass(/bg-emerald-500/);
  const cards = page.locator("a[href*='/deals/']");
  await expect(cards.first()).toContainText("2.000.000");
});

test("auth page returns a safe generic login error", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("Email").fill("traveler@example.com");
  await page.getByLabel("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("alert")).toContainText(/Đăng nhập chưa khả dụng|Không thể đăng nhập/);
  await expect(page.getByRole("alert")).not.toContainText(/Invalid login credentials|already registered/i);
});

test("saved deals page has a stable empty state without live deals", async ({ page }) => {
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "Deal đã lưu" })).toBeVisible();
  await expect(page.getByText("Chưa có deal nào được lưu hoặc deal đã hết hạn.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Khám phá deal" })).toHaveAttribute("href", "/deals");
});

test("privacy and accessibility foundations are reachable", async ({ page }) => {
  await page.goto("/deals");
  const skip = page.getByRole("link", { name: "Bỏ qua điều hướng" });
  await expect(skip).toHaveAttribute("href", "#main-content");
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Dữ liệu FlyCheap sử dụng" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Xuất hoặc xóa dữ liệu tài khoản" })).toBeVisible();
  await expect(page.getByText("Đăng nhập tại trang Tài khoản để xuất dữ liệu hoặc yêu cầu xóa tài khoản.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem điều khoản sử dụng" })).toHaveAttribute("href", "/terms");
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Điều khoản sử dụng FlyCheap" })).toBeVisible();
});

test("alert form blocks an invalid email before submission", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js**", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: 'window.turnstile={render:(_el,options)=>{setTimeout(()=>options.callback("turnstile-test-token"),0);return "test-widget"},remove:()=>{},reset:()=>{}};' });
  });
  await page.goto("/alerts");
  const email = page.getByRole("textbox", { name: "Email nhận xác nhận báo giá" });
  await email.fill("not-an-email");
  await page.getByRole("button", { name: "Tạo Alert Miễn Phí", exact: true }).click();
  await expect(email).toHaveValue("not-an-email");
  await expect(page).toHaveURL(/\/alerts$/);
});

test("alert form creates a valid alert and reaches the success state", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js**", async (route) => {
    await route.fulfill({ contentType: "application/javascript", body: 'window.turnstile={render:(_el,options)=>{setTimeout(()=>options.callback("turnstile-test-token"),0);return "test-widget"},remove:()=>{},reset:()=>{}};' });
  });
  await page.route("**/rest/v1/tracked_routes**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { origin_code: "HAN", origin_name: "Hà Nội", destination_code: "BKK", destination_name: "Bangkok", country: "Thái Lan", region: "asia", enabled: true },
    ]) });
  });
  await page.route("**/functions/v1/setup-alert", async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.turnstile_token).toBe("turnstile-test-token");
    expect(payload.alerts).toHaveLength(1);
    expect(payload.alerts[0].destination_code).toBe("BKK");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, alert_ids: ["alert-fixture"] }) });
  });
  await page.goto("/alerts");
  await page.getByRole("textbox", { name: "Email nhận xác nhận báo giá" }).fill("traveler@example.com");
  await page.getByRole("button", { name: "Bangkok" }).click();
  await expect(page.getByRole("button", { name: "Tạo Alert Miễn Phí", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Tạo Alert Miễn Phí", exact: true }).click();
  await expect(page.getByText("🎉 Đã đăng ký báo giá thành công!")).toBeVisible();
});

test("alert confirmation shows success after the Edge Function accepts the token", async ({ page }) => {
  await page.route("**/functions/v1/manage-alert", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, status: "active" }) });
  });
  await page.goto("/alerts/confirm?token=valid-token-value-123456789012345678901234567890");
  await expect(page.getByRole("heading", { name: "Hoàn tất" })).toBeVisible();
  await expect(page.getByText("Cảnh báo đã được xác nhận và bắt đầu hoạt động.")).toBeVisible();
});

test("alert unsubscribe rejects a link without signed parameters", async ({ page }) => {
  await page.goto("/alerts/unsubscribe");
  await expect(page.getByRole("heading", { name: "Không thể xử lý" })).toBeVisible();
  await expect(page.getByText("Liên kết không có mã xác thực.")).toBeVisible();
});

test("search applies and persists stop and inclusive date preferences", async ({ page }) => {
  await page.route("**/rest/v1/deals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "direct-fixture", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
          price: 2000000, normal_price: 3000000, discount: 33, currency: "VND", airline: "Fixture Air", airline_code: "FA",
          depart_date: "2099-10-01", return_date: "2099-10-05", duration: "2h 30m", stops: 0, stop_city: null, seats_left: 0,
          expires_in: "Kiểm tra lại", image: "", flight_number: "FA1", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 80 },
          hidden_costs: [], advertised_total: 2000000, real_total: 2000000, is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80,
          valid_until: "2099-01-02T00:00:00Z", link_kind: "live_source", booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
        },
        {
          id: "one-stop-fixture", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
          price: 1500000, normal_price: 3000000, discount: 50, currency: "VND", airline: "Fixture Air", airline_code: "FA",
          depart_date: "2099-10-01", return_date: "2099-10-05", duration: "5h 30m", stops: 1, stop_city: "SGN", seats_left: 0,
          expires_in: "Kiểm tra lại", image: "", flight_number: "FA2", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 75 },
          hidden_costs: [], advertised_total: 1500000, real_total: 1500000, is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 75,
          valid_until: "2099-01-02T00:00:00Z", link_kind: "live_source", booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
        },
      ]),
    });
  });
  await page.goto("/search");
  const stops = page.getByLabel("Số điểm dừng tối đa");
  await expect(page.getByText("2 Deal Khớp")).toBeVisible();
  await stops.selectOption("0");
  await expect(page.getByText("1 Deal Khớp")).toBeVisible();
  await page.getByLabel("Thời lượng bay tối đa").selectOption("180");
  await expect(page.getByText("1 Deal Khớp")).toBeVisible();
  await page.getByLabel("Điểm đến (tuỳ chọn)").fill("BKK");
  await expect(page.getByText("1 Deal Khớp")).toBeVisible();
  await page.getByLabel("Ngày khởi hành từ").fill("2099-10-01");
  await page.getByLabel("Ngày khởi hành đến").fill("2099-10-01");
  await expect(page.getByText("1 Deal Khớp")).toBeVisible();
  await page.reload();
  await expect(stops).toHaveValue("0");
  await expect(page.getByLabel("Thời lượng bay tối đa")).toHaveValue("180");
  await expect(page.getByLabel("Ngày khởi hành từ")).toHaveValue("2099-10-01");
  await expect(page.getByLabel("Ngày khởi hành đến")).toHaveValue("2099-10-01");
});

test("trip advisor shows an evidence-based empty state without live deals", async ({ page }) => {
  await page.route("**/rest/v1/deals**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/advisor");
  await page.getByRole("button", { name: "Tìm hành trình phù hợp" }).click();
  await expect(page.getByText("Chưa có deal phù hợp từ HAN trong ngân sách này.")).toBeVisible();
});

test("deal comparison displays total cost for a populated deal fixture", async ({ page }) => {
  await page.route("**/rest/v1/deals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{
        id: "deal-fixture-1", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
        price: 2000000, normal_price: 3000000, discount: 33, currency: "VND", airline: "Fixture Air", airline_code: "FA",
        depart_date: "2099-10-01", return_date: "2099-10-05", duration: "2h 30m", stops: 0, stop_city: null, seats_left: 0,
        expires_in: "Kiểm tra lại", image: "", flight_number: "FA1", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 80 },
        hidden_costs: [{ label: "Thuế", amount: 500000, note: "" }], advertised_total: 2000000, real_total: 2500000,
        is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80, observed_at: "2099-01-01T00:00:00Z", valid_until: "2099-01-02T00:00:00Z", link_kind: "live_source", booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
      }]),
    });
  });
  await page.goto("/deals");
  await page.getByRole("tab", { name: /Deal live/ }).click();
  await page.getByRole("button", { name: "So sánh BKK" }).click();
  const comparison = page.getByRole("region", { name: "So sánh deal" });
  await expect(comparison).toContainText("HAN → BKK");
  await expect(comparison).toContainText("2.500.000 VND");
  await expect(comparison).toContainText("Hoàn/đổi");
  await expect(comparison).toContainText("Chưa có dữ liệu");
});

test("deal detail exposes evidence, cost and booking action", async ({ page }) => {
  await page.route("**/rest/v1/deals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "detail-fixture-1", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
        price: 2000000, normal_price: 3000000, discount: 33, currency: "VND", airline: "Fixture Air", airline_code: "FA",
        depart_date: "2099-10-01", return_date: "2099-10-05", duration: "2h 30m", stops: 0, stop_city: null, seats_left: 0,
        expires_in: "Kiểm tra lại", image: "", flight_number: "FA1", ai_insight: { reason: "Giá thấp hơn lịch sử", tags: ["Dữ liệu lịch sử"], risk: "low", riskDetails: "Kiểm tra lại trước khi đặt", recommendation: "buy_now", recommendationNote: "Mức giảm tốt", savingScore: 80 },
        hidden_costs: [{ label: "Thuế", amount: 500000, note: "" }], advertised_total: 2000000, real_total: 2500000,
        is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80, ai_reasoning: "Giá thấp hơn mức tham chiếu từ dữ liệu lịch sử.", observed_at: "2099-01-01T00:00:00Z", valid_until: "2099-01-02T00:00:00Z",
        booking_url: "https://www.google.com/travel/flights?q=HAN-BKK", link_kind: "live_source",
      }),
    });
  });
  await page.route("**/rest/v1/price_history**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { date: "2099-09-28", price: 3200000 },
        { date: "2099-09-29", price: 2800000 },
        { date: "2099-09-30", price: 2000000 },
      ]),
    });
  });
  await page.goto("/deals/detail-fixture-1");
  await expect(page.getByRole("heading", { name: "HAN → Bangkok" })).toBeVisible();
  await expect(page.getByText("Độ tin cậy của dữ liệu")).toBeVisible();
  await expect(page.getByText("Tổng đã biết")).toBeVisible();
  await expect(page.getByText("Lịch Sử Giá (30 ngày)")).toBeVisible();
  await page.getByRole("button", { name: "7 ngày" }).click();
  await expect(page.getByText("Lịch Sử Giá (7 ngày)")).toBeVisible();
  await expect(page.getByText("Chưa đủ 14 quan sát hợp lệ để ước tính xu hướng giá.")).toBeVisible();
  await expect(page.getByText("Đánh giá phương án hiện tại")).toBeVisible();
  await expect(page.getByText("Risk low")).toBeVisible();
  await expect(page.getByText("Phân Tích Chi Phí Ẩn")).toBeVisible();
  await page.getByLabel("Hành lý thêm").fill("300000");
  await expect(page.getByText("2.800.000 VND")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kiểm tra giá trên trang đặt vé" })).toBeVisible();
});
