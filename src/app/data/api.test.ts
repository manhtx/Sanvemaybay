import { describe, expect, it } from "vitest";
import { filterDeals, isActiveFeedDeal, mapDealRow, mapObservedFare, mapPriceHistoryRows, parseFeedEnvelope, sanitizeBookingUrl } from "./api";
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

describe("isActiveFeedDeal", () => {
  const base = mapDealRow({
    id: "live", from: "Hà Nội", from_code: "HAN", to: "Bangkok", to_code: "BKK",
    country: "Thái Lan", region: "asia", price: 2_000_000, normal_price: 3_000_000,
    discount: 33, currency: "VND", airline: "Provider", airline_code: "PA",
    depart_date: "2026-09-01", return_date: "2026-09-05", duration: "2h", stops: 0,
    seats_left: 0, expires_in: "Kiểm tra lại", ai_insight: {}, hidden_costs: [],
    advertised_total: 2_000_000, real_total: 2_000_000, trip_type: "international",
    valid_until: "2026-08-12T00:00:00Z", booking_url: "https://aviasales.com/offer",
    link_kind: "live_source",
  });

  it("fails closed for legacy and stale feed rows", () => {
    const now = new Date("2026-08-11T00:00:00Z");
    expect(isActiveFeedDeal(base, now)).toBe(true);
    expect(isActiveFeedDeal({ ...base, linkKind: undefined }, now)).toBe(false);
    expect(isActiveFeedDeal({ ...base, validUntil: "2026-08-10T00:00:00Z" }, now)).toBe(false);
  });
});

describe("parseFeedEnvelope", () => {
  it("preserves a typed degraded schema state", () => {
    expect(parseFeedEnvelope({
      deals: [], status: "degraded_schema", source: "schema_check",
      generated_at: "2026-08-19T00:00:00Z", retryable: true,
      message: "Hệ thống dữ liệu đang được đồng bộ phiên bản.",
    })).toMatchObject({ status: "degraded_schema", retryable: true, rows: [] });
  });

  it("rejects legacy and unknown status payloads", () => {
    expect(parseFeedEnvelope({ deals: [] })).toBeUndefined();
    expect(parseFeedEnvelope({ deals: [], status: "ok" })).toBeUndefined();
  });
});

describe("mapObservedFare", () => {
  it("maps scoring, provenance and comparison evidence", () => {
    const fare = mapObservedFare({ id: "fare", origin: "Hà Nội", origin_code: "HAN", destination: "TP.HCM", destination_code: "SGN", country: "Việt Nam", region: "domestic", price: 2_000_000, baseline_price: 3_000_000, discount_percent: 33.3, currency: "VND", airline: "Air", airline_code: "VN", date: "2099-01-01", return_date: "2099-01-05", duration: "2h", stops: 0, deal_score: 88, deal_label: "Deal rất ngon", sample_size: 12, confidence_percent: 100, freshness_minutes: 20, booking_url: "https://www.google.com/travel/flights?q=HAN-SGN", timestamp: "2026-08-19T10:00:00Z" });
    expect(fare.discount).toBe(33.3);
    expect(fare.dealScore).toBe(88);
    expect(fare.linkKind).toBe("indicative");
    expect(fare.aiInsight.reason).toContain("33.3%");
    expect(fare.isFlashDeal).toBe(true);
    expect(fare.confidence).toBe(1);
  });

  it("does not present low-confidence observations as flash or trending", () => {
    const fare = mapObservedFare({ id: "low", origin: "Hà Nội", origin_code: "HAN", destination: "TP.HCM", destination_code: "SGN", country: "Việt Nam", region: "domestic", price: 2_000_000, baseline_price: 4_000_000, discount_percent: 50, currency: "VND", airline: "Air", airline_code: "VN", date: "2099-01-01", duration: "2h", stops: 0, deal_score: 95, deal_label: "Giá đáng chú ý", sample_size: 3, confidence_percent: 25, freshness_minutes: 20, booking_url: "https://www.google.com/travel/flights?q=HAN-SGN" });
    expect(fare.isFlashDeal).toBe(false);
    expect(fare.isTrending).toBe(false);
    expect(fare.confidence).toBe(0.25);
    expect(fare.aiInsight.tags).toContain("Tin cậy thấp");
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

describe("mapObservedFare", () => {
  it("maps observed fare with stable opportunityId and backward-compatible id", () => {
    const raw = {
      id: "97b21622-aa50-4f7d-b6bf-2d32d3edb3ac",
      origin: "Hà Nội",
      origin_code: "HAN",
      destination: "Kuala Lumpur",
      destination_code: "KUL",
      country: "Malaysia",
      region: "asia",
      price: 5212362,
      currency: "VND",
      date: "2026-10-16",
      return_date: "2026-10-20",
      airline: "Sun PhuQuoc Airways",
      airline_code: "9G",
      stops: 0,
      duration: "3h 40m",
      booking_url: "https://www.google.com/travel/flights?q=HAN-KUL",
      deal_score: 93,
      discount_percent: 84.2,
      sample_size: 6,
      confidence_percent: 50,
      freshness_minutes: 45,
    };

    const deal = mapObservedFare(raw);
    expect(deal.id).toBe("observed-97b21622-aa50-4f7d-b6bf-2d32d3edb3ac");
    expect(deal.observationId).toBe("97b21622-aa50-4f7d-b6bf-2d32d3edb3ac");
    expect(deal.opportunityId).toBe("HAN:KUL:2026-10-16:2026-10-20:9G:0");
    expect(deal.price).toBe(5212362);
  });
});
