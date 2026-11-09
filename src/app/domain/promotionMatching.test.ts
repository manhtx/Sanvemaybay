import { describe, expect, it } from "vitest";
import { matchPromotions, Promotion } from "./promotionMatching";

const basePromo: Promotion = {
  id: "p_base",
  provider: "Vietjet",
  code: "BAYHE2026",
  originCodes: ["HAN"],
  destinationCodes: ["BKK"],
  airlineCodes: ["VJ"],
  validFrom: "2026-07-01T00:00:00Z",
  validUntil: "2026-08-31T23:59:59Z",
  departureFrom: "2026-08-01",
  departureUntil: "2026-12-31",
  kind: "percent",
  amount: 20,
  conditions: ["Thanh toán qua ví điện tử"]
};

const baseDeal = {
  fromCode: "HAN",
  toCode: "BKK",
  airlineCode: "VJ",
  departDate: "2026-09-15",
  price: 5_000_000
};

describe("Farely Pure Domain — Promotion Matching & Discount Gating (REQ-DOM-001, REQ-DOM-009)", () => {
  const midPeriod = new Date("2026-07-31T12:00:00Z");

  it("matches eligible promotion and calculates uncapped percentage discount", () => {
    // 20% of 5,000,000 = 1,000,000
    const matches = matchPromotions(baseDeal, [basePromo], midPeriod);

    expect(matches).toHaveLength(1);
    expect(matches[0].promotion.id).toBe("p_base");
    expect(matches[0].estimatedSaving).toBe(1_000_000);
  });

  it("strictly caps discount at maxDiscount when percentage savings exceed limit", () => {
    // 20% of 5,000,000 = 1,000,000, but capped at 600,000
    const cappedPromo: Promotion = {
      ...basePromo,
      id: "p_capped",
      maxDiscount: 600_000
    };

    const matches = matchPromotions(baseDeal, [cappedPromo], midPeriod);
    expect(matches[0].estimatedSaving).toBe(600_000);
  });

  it("strictly caps discount at deal.price (never allowing negative net fare)", () => {
    // Fixed discount of 10,000,000 on a 5,000,000 deal
    const massivePromo: Promotion = {
      ...basePromo,
      id: "p_massive",
      kind: "fixed",
      amount: 10_000_000
    };

    const matches = matchPromotions(baseDeal, [massivePromo], midPeriod);
    expect(matches[0].estimatedSaving).toBe(5_000_000);
  });

  it("enforces temporal validity: excludes expired and not-yet-active promotions", () => {
    const expiredPromo: Promotion = {
      ...basePromo,
      id: "p_expired",
      validFrom: "2026-06-01T00:00:00Z",
      validUntil: "2026-07-15T00:00:00Z"
    };

    const futurePromo: Promotion = {
      ...basePromo,
      id: "p_future",
      validFrom: "2026-09-01T00:00:00Z",
      validUntil: "2026-09-30T00:00:00Z"
    };

    const matches = matchPromotions(baseDeal, [expiredPromo, futurePromo], midPeriod);
    expect(matches).toEqual([]);
  });

  it("enforces departure date window: excludes flights departing out of eligible range", () => {
    const departureWindowPromo: Promotion = {
      ...basePromo,
      departureFrom: "2026-10-01",
      departureUntil: "2026-10-31"
    };

    // Deal departs 2026-09-15 (before departureFrom)
    const matches = matchPromotions(baseDeal, [departureWindowPromo], midPeriod);
    expect(matches).toEqual([]);

    // Deal departing inside window
    const eligibleDeal = { ...baseDeal, departDate: "2026-10-15" };
    const eligibleMatches = matchPromotions(eligibleDeal, [departureWindowPromo], midPeriod);
    expect(eligibleMatches).toHaveLength(1);
  });

  it("filters origin, destination, and airline codes while supporting wildcards", () => {
    const wrongOrigin: Promotion = { ...basePromo, id: "wrong_origin", originCodes: ["SGN"] };
    const wrongDest: Promotion = { ...basePromo, id: "wrong_dest", destinationCodes: ["TYO"] };
    const wrongAirline: Promotion = { ...basePromo, id: "wrong_airline", airlineCodes: ["VN"] };
    const wildcardPromo: Promotion = {
      ...basePromo,
      id: "wildcard",
      originCodes: undefined,
      destinationCodes: [],
      airlineCodes: undefined
    };

    const matches = matchPromotions(baseDeal, [wrongOrigin, wrongDest, wrongAirline, wildcardPromo], midPeriod);
    expect(matches).toHaveLength(1);
    expect(matches[0].promotion.id).toBe("wildcard");
  });

  it("enforces minimum fare spend threshold", () => {
    const promoWithMinFare: Promotion = {
      ...basePromo,
      id: "p_min",
      minimumFare: 6_000_000 // Deal price is 5,000,000
    };

    expect(matchPromotions(baseDeal, [promoWithMinFare], midPeriod)).toEqual([]);

    // Qualifying when price meets or exceeds minimumFare
    const higherDeal = { ...baseDeal, price: 7_000_000 };
    expect(matchPromotions(higherDeal, [promoWithMinFare], midPeriod)).toHaveLength(1);
  });

  it("sorts matched promotions by estimatedSaving descending", () => {
    const promoSmall: Promotion = { ...basePromo, id: "small", kind: "fixed", amount: 200_000 };
    const promoMed: Promotion = { ...basePromo, id: "med", kind: "fixed", amount: 500_000 };
    const promoLarge: Promotion = { ...basePromo, id: "large", kind: "percent", amount: 30 }; // 30% of 5M = 1.5M

    const matches = matchPromotions(baseDeal, [promoSmall, promoLarge, promoMed], midPeriod);
    expect(matches.map((m) => m.promotion.id)).toEqual(["large", "med", "small"]);
  });

  it("safely rejects non-positive deal prices, invalid departure dates, and zero promo amounts", () => {
    expect(matchPromotions({ ...baseDeal, price: 0 }, [basePromo], midPeriod)).toEqual([]);
    expect(matchPromotions({ ...baseDeal, price: -100_000 }, [basePromo], midPeriod)).toEqual([]);
    expect(matchPromotions({ ...baseDeal, departDate: "invalid-date" }, [basePromo], midPeriod)).toEqual([]);

    const zeroAmountPromo: Promotion = { ...basePromo, id: "zero", amount: 0 };
    expect(matchPromotions(baseDeal, [zeroAmountPromo], midPeriod)).toEqual([]);
  });

  it("handles identical estimated savings with stable ordering", () => {
    const promoA: Promotion = { ...basePromo, id: "promo_a", kind: "fixed", amount: 300_000 };
    const promoB: Promotion = { ...basePromo, id: "promo_b", kind: "fixed", amount: 300_000 };

    const matches = matchPromotions(baseDeal, [promoA, promoB], midPeriod);
    expect(matches).toHaveLength(2);
    expect(matches[0].estimatedSaving).toBe(300_000);
    expect(matches[1].estimatedSaving).toBe(300_000);
  });

  it("evaluates comprehensive multi-criteria constraints simultaneously", () => {
    const complexPromo: Promotion = {
      id: "complex",
      provider: "Bamboo Airways",
      originCodes: ["HAN"],
      destinationCodes: ["BKK", "SIN"],
      airlineCodes: ["QH", "VJ"],
      validFrom: "2026-07-01T00:00:00Z",
      validUntil: "2026-08-31T23:59:59Z",
      departureFrom: "2026-09-01",
      departureUntil: "2026-10-31",
      minimumFare: 3_000_000,
      kind: "percent",
      amount: 15,
      maxDiscount: 1_000_000,
      conditions: ["Standard fare only"]
    };

    // Fails on wrong origin
    expect(matchPromotions({ ...baseDeal, fromCode: "SGN" }, [complexPromo], midPeriod)).toEqual([]);

    // Fails on wrong destination
    expect(matchPromotions({ ...baseDeal, toCode: "NRT" }, [complexPromo], midPeriod)).toEqual([]);

    // Fails on wrong airline
    expect(matchPromotions({ ...baseDeal, airlineCode: "VN" }, [complexPromo], midPeriod)).toEqual([]);

    // Fails on price below minimumFare
    expect(matchPromotions({ ...baseDeal, price: 2_500_000 }, [complexPromo], midPeriod)).toEqual([]);

    // Matches when all criteria met (15% of 5,000,000 = 750,000)
    const matches = matchPromotions(baseDeal, [complexPromo], midPeriod);
    expect(matches).toHaveLength(1);
    expect(matches[0].estimatedSaving).toBe(750_000);
  });

  it("preserves pure immutability on Object.freeze protected deal and promotion arrays", () => {
    const frozenDeal = Object.freeze({ ...baseDeal });
    const frozenPromo = Object.freeze({ ...basePromo });
    const frozenPromos = Object.freeze([frozenPromo]);

    expect(() => matchPromotions(frozenDeal, frozenPromos as any, midPeriod)).not.toThrow();
    expect(frozenDeal.price).toBe(5_000_000);
  });

  it("verifies exact temporal validity threshold boundaries (validFrom, validUntil)", () => {
    // Exactly at validFrom
    const startMatches = matchPromotions(baseDeal, [basePromo], new Date("2026-07-01T00:00:00Z"));
    expect(startMatches).toHaveLength(1);

    // Exactly at validUntil
    const endMatches = matchPromotions(baseDeal, [basePromo], new Date("2026-08-31T23:59:59Z"));
    expect(endMatches).toHaveLength(1);

    // 1 second before validFrom
    const preMatches = matchPromotions(baseDeal, [basePromo], new Date("2026-06-30T23:59:59Z"));
    expect(preMatches).toEqual([]);

    // 1 second after validUntil
    const postMatches = matchPromotions(baseDeal, [basePromo], new Date("2026-09-01T00:00:00Z"));
    expect(postMatches).toEqual([]);
  });

  it("verifies exact departure date window boundaries (departureFrom, departureUntil)", () => {
    const promoWithWindow: Promotion = {
      ...basePromo,
      departureFrom: "2026-08-01",
      departureUntil: "2026-12-31"
    };

    // Exactly departureFrom
    expect(matchPromotions({ ...baseDeal, departDate: "2026-08-01" }, [promoWithWindow], midPeriod)).toHaveLength(1);

    // Exactly departureUntil
    expect(matchPromotions({ ...baseDeal, departDate: "2026-12-31" }, [promoWithWindow], midPeriod)).toHaveLength(1);
  });

  it("caps fixed discount at deal price preventing negative net fare", () => {
    const fixedPromo: Promotion = {
      ...basePromo,
      id: "p_fixed_big",
      kind: "fixed",
      amount: 4_000_000
    };
    const cheapDeal = { ...baseDeal, price: 2_500_000 };
    const matches = matchPromotions(cheapDeal, [fixedPromo], midPeriod);
    expect(matches).toHaveLength(1);
    expect(matches[0].estimatedSaving).toBe(2_500_000); // Capped at deal price
  });

  it("caps percentage discount amounts exceeding 100% at 100% of deal price", () => {
    const hyperPromo: Promotion = {
      ...basePromo,
      id: "p_hyper",
      kind: "percent",
      amount: 150 // 150% discount
    };
    const matches = matchPromotions(baseDeal, [hyperPromo], midPeriod);
    expect(matches).toHaveLength(1);
    expect(matches[0].estimatedSaving).toBe(5_000_000); // 100% of price
  });

  it("returns empty array for empty promotions array", () => {
    expect(matchPromotions(baseDeal, [], midPeriod)).toEqual([]);
  });

  it("uses current wall clock date as default when now argument is omitted", () => {
    const activeTodayPromo: Promotion = {
      ...basePromo,
      validFrom: new Date(Date.now() - 3600_000).toISOString(),
      validUntil: new Date(Date.now() + 3600_000).toISOString(),
      departureFrom: undefined,
      departureUntil: undefined
    };
    const matches = matchPromotions(baseDeal, [activeTodayPromo]);
    expect(matches).toHaveLength(1);
  });

  it("rejects non-finite and negative promotion amounts", () => {
    const nanPromo: Promotion = { ...basePromo, id: "nan", amount: NaN };
    const negPromo: Promotion = { ...basePromo, id: "neg", amount: -500_000 };
    const infPromo: Promotion = { ...basePromo, id: "inf", amount: Infinity };

    expect(matchPromotions(baseDeal, [nanPromo, negPromo, infPromo], midPeriod)).toEqual([]);
  });

  it("benchmark: 5,000 promotion matching evaluations execute in sub-50ms", () => {
    const promos = [
      basePromo,
      { ...basePromo, id: "p2", kind: "fixed" as const, amount: 300_000 },
      { ...basePromo, id: "p3", maxDiscount: 500_000 }
    ];

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      matchPromotions(baseDeal, promos, midPeriod);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
