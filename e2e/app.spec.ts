import { expect, test } from "@playwright/test";

test("homepage renders the opportunity-first experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Không cần biết đi đâu. Chỉ cần biết khi nào rẻ." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem Deal Ngay" })).toHaveAttribute("href", "/deals");
  await expect(page.getByText("Deal Nóng Hôm Nay")).toBeVisible();
});

test("homepage renders validated feed sections when deals exist", async ({ page }) => {
  await page.route("**/rest/v1/deals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{
        id: "feed-fixture", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
        price: 2000000, normal_price: 3000000, discount: 33, currency: "VND", airline: "Fixture Air", airline_code: "FA",
        depart_date: "2099-10-01", return_date: "2099-10-05", duration: "2h 30m", stops: 0, stop_city: null, seats_left: 0,
        expires_in: "Kiểm tra lại", image: "", flight_number: "FA1", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 80 },
        hidden_costs: [], advertised_total: 2000000, real_total: 2000000, is_trending: true, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80,
        observed_at: "2099-01-01T00:00:00Z", valid_until: "2099-01-02T00:00:00Z",
      }]),
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mới phát hiện" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Giảm giá lớn nhất" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đề xuất theo preference" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Điểm đến đang nổi bật" })).toBeVisible();
});

test("auth page explains when Supabase Auth is not configured", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("Email").fill("traveler@example.com");
  await page.getByLabel("Mật khẩu").fill("password123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("alert")).toContainText(/Supabase Auth chưa được cấu hình|Invalid login credentials/);
});

test("saved deals page has a stable empty state without live deals", async ({ page }) => {
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "Deal đã lưu" })).toBeVisible();
  await expect(page.getByText("Chưa có deal nào được lưu hoặc deal đã hết hạn.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Khám phá deal" })).toHaveAttribute("href", "/deals");
});

test("alert form blocks an invalid email before submission", async ({ page }) => {
  await page.goto("/alerts");
  const email = page.getByRole("textbox", { name: "your@email.com" });
  await email.fill("not-an-email");
  await page.getByRole("button", { name: "Tạo Alert Miễn Phí", exact: true }).click();
  await expect(email).toHaveValue("not-an-email");
  await expect(page).toHaveURL(/\/alerts$/);
});

test("alert form creates a valid alert and reaches the success state", async ({ page }) => {
  await page.route("**/rest/v1/tracked_routes**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { origin_code: "HAN", origin_name: "Hà Nội", destination_code: "BKK", destination_name: "Bangkok", country: "Thái Lan", region: "asia", enabled: true },
    ]) });
  });
  await page.route("**/functions/v1/setup-alert", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, alert_id: "alert-fixture" }) });
  });
  await page.goto("/alerts");
  await page.getByRole("textbox", { name: "your@email.com" }).fill("traveler@example.com");
  await page.getByRole("button", { name: "Bangkok" }).click();
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
          valid_until: "2099-01-02T00:00:00Z",
        },
        {
          id: "one-stop-fixture", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK", country: "Thái Lan", region: "asia",
          price: 1500000, normal_price: 3000000, discount: 50, currency: "VND", airline: "Fixture Air", airline_code: "FA",
          depart_date: "2099-10-01", return_date: "2099-10-05", duration: "5h 30m", stops: 1, stop_city: "SGN", seats_left: 0,
          expires_in: "Kiểm tra lại", image: "", flight_number: "FA2", ai_insight: { reason: "fixture", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 75 },
          hidden_costs: [], advertised_total: 1500000, real_total: 1500000, is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 75,
          valid_until: "2099-01-02T00:00:00Z",
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
        is_trending: false, is_flash_deal: false, trip_type: "international", confidence: 0.8, deal_score: 80, observed_at: "2099-01-01T00:00:00Z", valid_until: "2099-01-02T00:00:00Z",
      }]),
    });
  });
  await page.goto("/deals");
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
        booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
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
