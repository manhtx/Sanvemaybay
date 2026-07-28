import { describe, expect, it } from "vitest";
import { mapDealRow, sanitizeBookingUrl } from "./api";

describe("mapDealRow", () => {
  it("maps the Supabase row shape to the UI deal shape", () => {
    const deal = mapDealRow({
      id: "deal-id",
      from: "Hà Nội",
      from_code: "HAN",
      to: "Bangkok",
      to_code: "BKK",
      country: "Thái Lan",
      region: "asia",
      price: "2100000",
      normal_price: "3000000",
      discount: 30,
      currency: "VND",
      airline: "Example Air",
      airline_code: "EA",
      depart_date: "2026-09-01",
      return_date: "2026-09-05",
      duration: "2h",
      stops: 0,
      stop_city: null,
      seats_left: 0,
      expires_in: "Kiểm tra lại trước khi đặt",
      image: "https://example.com/image.jpg",
      flight_number: "EA 123",
      ai_insight: {
        reason: "Giá thấp hơn lịch sử.",
        tags: ["Dữ liệu lịch sử"],
        risk: "low",
        riskDetails: "Giá có thể thay đổi.",
        recommendation: "buy_now",
        recommendationNote: "Kiểm tra trước khi đặt.",
        savingScore: 85,
      },
      hidden_costs: [],
      advertised_total: "2100000",
      real_total: "2100000",
      is_trending: true,
      is_flash_deal: true,
      trip_type: "international",
      confidence: 0.82,
      deal_score: 85,
      ai_reasoning: "Có đủ dữ liệu.",
      booking_url: "https://www.google.com/travel/flights?q=HAN-BKK",
    });

    expect(deal.fromCode).toBe("HAN");
    expect(deal.toCode).toBe("BKK");
    expect(deal.price).toBe(2_100_000);
    expect(deal.normalPrice).toBe(3_000_000);
    expect(deal.aiInsight.recommendation).toBe("buy_now");
    expect(deal.dealScore).toBe(85);
    expect(deal.bookingUrl).toContain("google.com/travel/flights");
  });
});

describe("sanitizeBookingUrl", () => {
  it("accepts approved HTTPS booking hosts", () => {
    expect(sanitizeBookingUrl("https://www.google.com/travel/flights?q=HAN-BKK"))
      .toContain("google.com/travel/flights");
  });

  it("rejects executable and unknown links", () => {
    expect(sanitizeBookingUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeBookingUrl("https://example.com/book")).toBeUndefined();
  });
});
