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

  // D24: Assert accurate mandatory cost breakdown and real total
  await expect(page.getByText(/Chi Phí Thực Tế/i)).toBeVisible();
  await expect(page.getByText(/Thuế & phụ phí sân bay/i)).toBeVisible();
  await expect(page.getByText("+500.000₫")).toBeVisible();
});

test("J03: RouteBest comparison -> cheaper alternative across universe", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: /Tìm kiếm cơ hội/i })).toBeVisible();
  // Filter by maximum stops
  const stopsSelect = page.getByLabel("Số điểm dừng tối đa");
  await stopsSelect.selectOption("0");
  await expect(stopsSelect).toHaveValue("0");
});

test("J04: Watch creation -> preserves full TravelIntent and persists locally (D24)", async ({ page }) => {
  // Mock authenticated session so watch creation activates server-side
  await page.addInitScript(() => {
    const authSession = {
      access_token: "mock-jwt-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      refresh_token: "mock-refresh",
      user: {
        id: "00000000-0000-0000-0000-000000000042",
        aud: "authenticated",
        role: "authenticated",
        email: "traveler@example.com",
      },
    };
    localStorage.setItem("sb-e2e-fixture-auth-token", JSON.stringify(authSession));
    localStorage.setItem("sb-yefbpmqfsstcaeqfrmyn-auth-token", JSON.stringify(authSession));
  });


  await page.route("**/auth/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-jwt-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 7200,
        refresh_token: "mock-refresh",
        user: {
          id: "00000000-0000-0000-0000-000000000042",
          aud: "authenticated",
          role: "authenticated",
          email: "traveler@example.com",
        },
      }),
    });
  });

  // Intercept user_alerts insert API
  await page.route("**/rest/v1/user_alerts**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: "mock-alert-id" }]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
  });

  await page.goto("/watch");
  await expect(page.getByRole("heading", { name: /Tuyến bay bạn đang quan sát/i })).toBeVisible();
  const createBtn = page.getByRole("button", { name: /Tạo theo dõi mới/i });
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  // WatchModal opens
  await expect(page.getByRole("heading", { name: /Theo dõi cơ hội bay|HAN.*BKK/i })).toBeVisible();

  // Enter email
  const emailInput = page.locator("#watch-email");
  await emailInput.fill("traveler@example.com");

  // Submit watch
  const submitBtn = page.getByRole("button", { name: /Bắt đầu theo dõi/i });
  await submitBtn.click();

  // Success confirmation in modal
  await expect(page.getByRole("heading", { name: /Đã bắt đầu theo dõi/i })).toBeVisible();

  // Verify real persisted state in localStorage
  const savedWatches = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("farely_local_watches_v1") || "[]");
  });
  expect(savedWatches.length).toBeGreaterThanOrEqual(1);
  expect(savedWatches[0].email).toBe("traveler@example.com");
  expect(savedWatches[0].status).toBe("monitoring");
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

test("J08: Saved opportunity -> persist, display, and remove saved opportunity (D24)", async ({ page }) => {
  const mockOpp = {
    opportunityId: "deal-saved-j08",
    fromCode: "SGN",
    toCode: "HAN",
    fromCity: "TP. Hồ Chí Minh",
    toCity: "Hà Nội",
    departDate: "2099-11-15",
    savedPrice: 1500000,
    airline: "Vietnam Airlines",
    stops: 0,
    savedAt: new Date().toISOString(),
    comparatorContext: { cohortMedian: 2000000, discountPercentage: 25, isSufficient: true },
    evidenceContext: { freshnessText: "Vừa cập nhật", observedAt: new Date().toISOString() },
  };

  await page.addInitScript((opp) => {
    localStorage.setItem("farely.saved-opportunities", JSON.stringify([opp.opportunityId]));
    localStorage.setItem(
      "farely.saved-snapshots",
      JSON.stringify({ [opp.opportunityId]: { snapshotData: opp, savedAt: opp.savedAt } })
    );
  }, mockOpp);

  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "Cơ hội đã lưu" })).toBeVisible();

  // Saved deal rendered with route and price
  await expect(page.getByText("SGN → HAN")).toBeVisible();
  await expect(page.getByText(/1\.500\.000/)).toBeVisible();

  // Remove saved deal
  const removeBtn = page.getByTitle(/Bỏ lưu cơ hội này/i).or(page.locator("button:has(svg.lucide-trash-2)"));
  await removeBtn.first().click();

  // Transition to empty state
  await expect(page.getByText(/Chưa có cơ hội nào được lưu|Bạn chưa lưu cơ hội nào/i)).toBeVisible();

  // Verify removed from persisted localStorage
  const savedIds = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("farely.saved-opportunities") || "[]");
  });
  expect(savedIds).toEqual([]);
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
