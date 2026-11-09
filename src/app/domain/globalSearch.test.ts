import { describe, expect, it } from "vitest";
import { filterDeals } from "../data/api";
import { resolveCanonicalAirportOrCity } from "./travelEntities";
import { Deal } from "../data/deals";

function makeDummyDeal(
  index: number,
  origin: string,
  destination: string,
  destName: string,
  price: number,
  overrides: Partial<Deal> = {},
): Deal {
  return {
    id: `deal-${index}`,
    from: origin === "HAN" ? "Hà Nội" : origin,
    fromCode: origin,
    to: destName,
    toCode: destination,
    country: destination === "BKK" || destination === "DMK" ? "Thái Lan" : "Việt Nam",
    region: destination === "BKK" || destination === "DMK" ? "asia" : "domestic",
    price,
    normalPrice: price * 1.3,
    discount: 23,
    currency: "VND",
    airline: "VietJet Air",
    airlineCode: "VJ",
    departDate: "2026-11-01",
    returnDate: "2026-11-05",
    duration: "2h 00m",
    stops: 0,
    stopCity: null,
    seatsLeft: 5,
    expiresIn: "2 giờ",
    image: "",
    flightNumber: "VJ901",
    aiInsight: {
      reason: "Mức giá quan sát tốt",
      tags: ["Giá quan sát"],
      risk: "low",
      riskDetails: "Chuyến bay thẳng tiêu chuẩn",
      recommendation: "wait",
      recommendationNote: "Kiểm tra giá trước khi đặt",
      savingScore: 80,
    },
    hiddenCosts: [],
    advertisedTotal: price,
    realTotal: price,
    isTrending: false,
    isFlashDeal: false,
    tripType: "international",
    ...overrides,
  };
}

describe("Global Canonical Search - Negative Controls & Deep Pagination", () => {
  it("resolves canonical entity 'Bangkok' to BKK_ALL (serving BKK and DMK) and 'Hà Nội' to HAN", () => {
    const dest = resolveCanonicalAirportOrCity("Bangkok");
    expect(dest?.code).toBe("BKK_ALL");
    expect(dest?.servedAirports).toEqual(["BKK", "DMK"]);

    const orig = resolveCanonicalAirportOrCity("Hà Nội");
    expect(orig?.code).toBe("HAN");
  });

  it("Negative Control: finds target record placed beyond row 60, row 120, and row 1000", () => {
    // Generate a simulated corpus of 1200 records where target BKK deals are at rows 65, 150, and 1050
    const corpus: Deal[] = Array.from({ length: 1200 }, (_, i) => {
      if (i === 65) return makeDummyDeal(65, "HAN", "BKK", "Bangkok", 4500000);
      if (i === 150) return makeDummyDeal(150, "HAN", "BKK", "Bangkok", 4600000);
      if (i === 1050) return makeDummyDeal(1050, "HAN", "BKK", "Bangkok", 4400000);
      return makeDummyDeal(i, "HAN", "DAD", "Đà Nẵng", 1200000);
    });

    // 1. Search by IATA code "BKK"
    const resultsByCode = filterDeals(corpus, {
      from: "HAN",
      destination: "BKK",
    });
    expect(resultsByCode.length).toBe(3);
    expect(resultsByCode.map((d) => d.id)).toEqual(["deal-65", "deal-150", "deal-1050"]);

    // 2. Search by natural language query "Bangkok"
    const resultsByName = filterDeals(corpus, {
      from: "HAN",
      destination: "Bangkok",
    });
    expect(resultsByName.length).toBe(3);
    expect(resultsByName.map((d) => d.id)).toEqual(["deal-65", "deal-150", "deal-1050"]);

    // 3. Search with budget constraint <= 4.55M (should find deal-65 and deal-1050)
    const resultsBudget = filterDeals(corpus, {
      from: "HAN",
      destination: "Bangkok",
      budget: 4550000,
    });
    expect(resultsBudget.length).toBe(2);
    expect(resultsBudget.map((d) => d.id)).toEqual(["deal-65", "deal-1050"]);
  });

  it("Negative Control: does not emit false 'Không tìm thấy' when query matches aliases like 'Suvarnabhumi'", () => {
    const corpus = [
      makeDummyDeal(1, "HAN", "BKK", "Bangkok", 4500000),
      makeDummyDeal(2, "HAN", "SGN", "TP. Hồ Chí Minh", 1500000),
    ];
    const results = filterDeals(corpus, {
      from: "HAN",
      destination: "Suvarnabhumi",
    });
    expect(results.length).toBe(1);
    expect(results[0].toCode).toBe("BKK");
  });

  it("expands metropolitan area search to match all constituent sister airports", () => {
    const corpus = [
      makeDummyDeal(1, "HAN", "BKK", "Bangkok", 3000000), // Suvarnabhumi
      makeDummyDeal(2, "HAN", "DMK", "Bangkok", 2500000), // Don Mueang
      makeDummyDeal(3, "HAN", "SIN", "Singapore", 3200000),
    ];

    // Searching generic city "Bangkok" returns deals to both BKK and DMK
    const bangkokResults = filterDeals(corpus, { destination: "Bangkok" });
    expect(bangkokResults).toHaveLength(2);
    expect(bangkokResults.map((d) => d.toCode)).toEqual(["BKK", "DMK"]);

    // Specific sister airport query "DMK" isolates Don Mueang and rejects BKK
    const dmkResults = filterDeals(corpus, { destination: "DMK" });
    expect(dmkResults).toHaveLength(1);
    expect(dmkResults[0].toCode).toBe("DMK");
  });

  it("expands Tokyo metropolitan area to match both Narita and Haneda", () => {
    const corpus = [
      makeDummyDeal(1, "HAN", "NRT", "Tokyo", 6000000),
      makeDummyDeal(2, "HAN", "HND", "Tokyo", 6500000),
      makeDummyDeal(3, "HAN", "KIX", "Osaka", 5500000),
    ];

    const tokyoResults = filterDeals(corpus, { destination: "Tokyo" });
    expect(tokyoResults).toHaveLength(2);
    expect(tokyoResults.map((d) => d.toCode)).toEqual(["NRT", "HND"]);
  });

  it("returns empty array when no deals in corpus match search criteria", () => {
    const corpus = [
      makeDummyDeal(1, "HAN", "DAD", "Đà Nẵng", 1200000),
    ];
    expect(filterDeals(corpus, { destination: "Paris" })).toEqual([]);
    expect(filterDeals([], { destination: "Bangkok" })).toEqual([]);
  });
});
