import { describe, expect, it } from "vitest";
import { filterDeals, mapDealRow, mapPriceHistoryRows, sanitizeBookingUrl } from "./api";
import { normalizeAIInsight } from "./deals";

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

describe("normalizeAIInsight", () => {
  it("provides safe defaults for malformed provider payloads", () => {
    expect(normalizeAIInsight({ risk: "unknown", recommendation: "execute", savingScore: 999, tags: ["ok", 3] })).toMatchObject({
      risk: "medium", recommendation: "wait", savingScore: 100, tags: ["ok"],
    });
    expect(normalizeAIInsight(null).reason).toContain("Chưa có giải thích");
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

describe("filterDeals", () => {
  const deals = [
    { fromCode: "HAN", price: 2_000_000, stops: 0 },
    { fromCode: "HAN", price: 1_500_000, stops: 1 },
  ] as any;

  it("supports direct-flight-only filtering", () => {
    expect(filterDeals(deals, { maxStops: 0 })).toHaveLength(1);
    expect(filterDeals(deals, { maxStops: 0 })[0].stops).toBe(0);
  });

  it("keeps all routes when no stop preference is provided", () => {
    expect(filterDeals(deals, {})).toHaveLength(2);
  });

  it("filters the inclusive departure date range and rejects reversed ranges", () => {
    const dated = [
      { ...deals[0], departDate: "2026-09-01" },
      { ...deals[1], departDate: "2026-09-10" },
      { ...deals[0], departDate: "2026-09-20" },
    ] as any;
    expect(filterDeals(dated, { departureFrom: "2026-09-01", departureTo: "2026-09-10" })).toHaveLength(2);
    expect(filterDeals(dated, { departureFrom: "2026-09-11", departureTo: "2026-09-10" })).toEqual([]);
  });

  it("searches destination by code, name or country case-insensitively", () => {
    const destinations = [
      { ...deals[0], to: "Bangkok", toCode: "BKK", country: "Thái Lan" },
      { ...deals[1], to: "Tokyo", toCode: "NRT", country: "Nhật Bản" },
    ] as any;
    expect(filterDeals(destinations, { destination: "bkk" })).toHaveLength(1);
    expect(filterDeals(destinations, { destination: "nhật" })).toHaveLength(1);
    expect(filterDeals(destinations, { destination: "" })).toHaveLength(2);
  });

  it("filters by parsed maximum flight duration while keeping unknown duration evidence", () => {
    const durations = [
      { ...deals[0], duration: "2h 30m" },
      { ...deals[1], duration: "5h" },
      { ...deals[0], duration: "unknown" },
    ] as any;
    expect(filterDeals(durations, { maxFlightTimeMinutes: 180 })).toHaveLength(2);
  });
});

describe("mapPriceHistoryRows", () => {
  it("keeps valid positive observations and discards malformed values", () => {
    expect(mapPriceHistoryRows([
      { date: "2026-08-01", price: "2200000" },
      { date: "2026-08-02", price: 0 },
      { date: "2026-08-03", price: "not-a-price" },
    ])).toEqual([{ date: "2026-08-01", price: 2200000 }]);
  });
});
