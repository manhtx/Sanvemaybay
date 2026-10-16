import { describe, it, expect } from "vitest";
import { buildDataProvenance, formatObservedAge } from "./provenance";
import { Deal } from "../data/deals";

function mockDeal(partial: Partial<Deal>): Deal {
  return {
    id: "deal-prov-1",
    from: "Hà Nội",
    fromCode: "HAN",
    to: "Bangkok",
    toCode: "BKK",
    country: "Thái Lan",
    region: "asia",
    price: 2100000,
    normalPrice: 3000000,
    discount: 30,
    currency: "VND",
    airline: "Vietjet Air",
    airlineCode: "VJ",
    departDate: "2026-11-15",
    duration: "1h 55m",
    stops: 0,
    stopCity: null,
    seatsLeft: 5,
    expiresIn: "3 ngày",
    image: "",
    flightNumber: "VJ901",
    aiInsight: {
      reason: "Giá thấp hơn trung bình",
      tags: [],
      risk: "low",
      riskDetails: "",
      recommendation: "buy_now",
      recommendationNote: "",
      savingScore: 85,
    },
    hiddenCosts: [],
    advertisedTotal: 2100000,
    realTotal: 2100000,
    tripType: "international",
    ...partial,
  };
}

describe("Data Provenance Contracts (F35, F72, F80)", () => {
  it("correctly marks standard observed deals as OBSERVED with indicative CTA (F35, F72)", () => {
    const deal = mockDeal({
      linkKind: "indicative",
      observedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
    });

    const prov = buildDataProvenance(deal);
    expect(prov.status).toBe("OBSERVED");
    expect(prov.statusLabel).toBe("Giá quan sát chỉ dẫn");
    expect(prov.ctaMode).toBe("INDICATIVE_RECHECK");
    expect(prov.ctaLabel).toBe("Kiểm tra giá tại nguồn");
    expect(prov.ageLabel).toBe("2 giờ trước");
    expect(prov.freshnessTier).toBe("FRESH");
    expect(prov.disclaimer).toContain("giá quan sát");
  });

  it("marks revalidated or direct source deals as VERIFIED", () => {
    const deal = mockDeal({
      linkKind: "live_source",
      observedAt: new Date(Date.now() - 60000 * 15).toISOString(), // 15 mins ago
    });

    const prov = buildDataProvenance(deal);
    expect(prov.status).toBe("VERIFIED");
    expect(prov.statusLabel).toBe("Đã xác minh nguồn");
    expect(prov.disclaimer).toContain("xác thực trực tiếp tại nguồn");
  });

  it("marks zero seats or unavailable deals as UNAVAILABLE", () => {
    const deal = mockDeal({
      seatsLeft: 0,
      observedAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    });

    const prov = buildDataProvenance(deal);
    expect(prov.status).toBe("UNAVAILABLE");
    expect(prov.statusLabel).toBe("Không còn khả dụng");
    expect(prov.freshnessTier).toBe("STALE");
  });

  it("enforces F72 exact CTA only when live partner link is present", () => {
    const dealWithAffiliate = mockDeal({
      linkKind: "live_affiliate",
      affiliateUrl: "https://partner.example.com/book/123",
      affiliateNetwork: "Agoda",
    });

    const prov = buildDataProvenance(dealWithAffiliate);
    expect(prov.ctaMode).toBe("EXACT_BOOKING");
    expect(prov.ctaLabel).toBe("Đặt vé qua đối tác");
    expect(prov.sourceName).toBe("Agoda");
  });

  it("formats observed ages into accurate human Vietnamese and freshness tiers", () => {
    const now = 1760000000000;
    // < 5 mins
    const fresh5m = formatObservedAge(new Date(now - 120000).toISOString(), now);
    expect(fresh5m.ageLabel).toBe("Vừa quét (Mới)");
    expect(fresh5m.freshnessTier).toBe("FRESH");

    // 45 mins
    const fresh45m = formatObservedAge(new Date(now - 2700000).toISOString(), now);
    expect(fresh45m.ageLabel).toBe("45 phút trước");
    expect(fresh45m.freshnessTier).toBe("FRESH");

    // 8 hours
    const acceptable8h = formatObservedAge(new Date(now - 28800000).toISOString(), now);
    expect(acceptable8h.ageLabel).toBe("8 giờ trước");
    expect(acceptable8h.freshnessTier).toBe("ACCEPTABLE");

    // 2 days
    const stale2d = formatObservedAge(new Date(now - 172800000).toISOString(), now);
    expect(stale2d.ageLabel).toBe("2 ngày trước");
    expect(stale2d.freshnessTier).toBe("STALE");
  });
});
