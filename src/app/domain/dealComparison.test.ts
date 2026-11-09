import { describe, expect, it } from "vitest";
import {
  compareDeals,
  DealComparisonRow,
  explainTradeoff,
  identifyDominatedOptions,
} from "./dealComparison";

describe("deal comparison", () => {
  describe("compareDeals projection & duration parsing", () => {
    it("compares total cost and parses composite duration without inventing missing values", () => {
      const rows = compareDeals([
        {
          id: "deal-1",
          from: "Hà Nội",
          fromCode: "HAN",
          to: "Bangkok",
          toCode: "BKK",
          country: "Thái Lan",
          region: "asia",
          price: 2_000_000,
          normalPrice: 3_000_000,
          discount: 33,
          currency: "VND",
          airline: "Air",
          airlineCode: "A",
          departDate: "2026-10-01",
          duration: "2h 30m",
          stops: 1,
          stopCity: null,
          seatsLeft: 0,
          expiresIn: "soon",
          image: "",
          flightNumber: "A1",
          aiInsight: {
            reason: "data",
            tags: [],
            risk: "low",
            riskDetails: "",
            recommendation: "wait",
            recommendationNote: "",
            savingScore: 70,
          },
          hiddenCosts: [{ label: "Tax", amount: 200_000, note: "" }],
          advertisedTotal: 2_000_000,
          realTotal: 2_200_000,
          tripType: "international",
        },
      ]);

      expect(rows[0]).toMatchObject({
        id: "deal-1",
        route: "HAN → BKK",
        ticketPrice: 2_000_000,
        totalCost: 2_200_000,
        durationMinutes: 150,
        stops: 1,
        risk: "low",
      });
      expect(rows[0].refundPolicy).toBeUndefined();
    });

    it("parses hours-only, minutes-only, and malformed duration strings", () => {
      const baseDeal = {
        id: "d",
        from: "HAN",
        fromCode: "HAN",
        to: "SGN",
        toCode: "SGN",
        country: "VN",
        region: "domestic" as const,
        price: 1_000_000,
        normalPrice: 1_500_000,
        discount: 33,
        currency: "VND" as const,
        airline: "VN",
        airlineCode: "VN",
        departDate: "2026-10-01",
        stops: 0,
        stopCity: null,
        seatsLeft: 5,
        expiresIn: "1d",
        image: "",
        flightNumber: "VN1",
        aiInsight: {
          reason: "",
          tags: [],
          risk: "low" as const,
          riskDetails: "",
          recommendation: "buy_now" as const,
          recommendationNote: "",
          savingScore: 80,
        },
        hiddenCosts: [],
        advertisedTotal: 1_000_000,
        realTotal: 1_000_000,
        tripType: "domestic" as const,
      };

      const rows = compareDeals([
        { ...baseDeal, id: "hours", duration: "4h" },
        { ...baseDeal, id: "minutes", duration: "45m" },
        { ...baseDeal, id: "composite", duration: "1h 15m" },
        { ...baseDeal, id: "malformed", duration: "direct flight" },
      ]);

      expect(rows.find((r) => r.id === "hours")?.durationMinutes).toBe(240);
      expect(rows.find((r) => r.id === "minutes")?.durationMinutes).toBe(45);
      expect(rows.find((r) => r.id === "composite")?.durationMinutes).toBe(75);
      expect(rows.find((r) => r.id === "malformed")?.durationMinutes).toBeUndefined();
    });
  });

  describe("explainTradeoff narratives & currency formatting", () => {
    const makeRow = (overrides: Partial<DealComparisonRow>): DealComparisonRow => ({
      id: "row",
      route: "HAN → BKK",
      ticketPrice: 2_000_000,
      totalCost: 2_000_000,
      durationMinutes: 120,
      stops: 0,
      refundPolicy: undefined,
      risk: "low",
      ...overrides,
    });

    it("returns equivalence narrative when price difference is zero or negative", () => {
      const optionA = makeRow({ totalCost: 2_000_000 });
      const optionB = makeRow({ totalCost: 2_000_000 });
      expect(explainTradeoff(optionA, optionB)).toBe("Hai phương án có tổng chi phí tương đương.");

      const optionC = makeRow({ totalCost: 2_500_000 });
      // cheaper is actually more expensive than costlier
      expect(explainTradeoff(optionC, optionA)).toBe("Hai phương án có tổng chi phí tương đương.");
    });

    it("formats VND millions with decimal or integer representation, and thousands as 'k'", () => {
      // 1.5 million difference
      const exp1 = explainTradeoff(makeRow({ totalCost: 1_000_000 }), makeRow({ totalCost: 2_500_000 }));
      expect(exp1).toContain("1.5 triệu");

      // Exactly 2 million difference (strips .0)
      const exp2 = explainTradeoff(makeRow({ totalCost: 1_000_000 }), makeRow({ totalCost: 3_000_000 }));
      expect(exp2).toContain("2 triệu");

      // 450k difference
      const exp3 = explainTradeoff(makeRow({ totalCost: 1_000_000 }), makeRow({ totalCost: 1_450_000 }));
      expect(exp3).toContain("450k");
    });

    it("explains tradeoffs when cheaper flight has more stops and longer duration", () => {
      const cheaper = makeRow({ totalCost: 1_500_000, durationMinutes: 480, stops: 2 });
      const direct = makeRow({ totalCost: 2_400_000, durationMinutes: 120, stops: 0 });

      const explanation = explainTradeoff(cheaper, direct);
      expect(explanation).toContain("Rẻ hơn khoảng 900k");
      expect(explanation).toContain("mất thêm 6 giờ");
      expect(explanation).toContain("thêm 2 điểm dừng");
    });

    it("highlights when a cheaper flight is also substantially faster (<= -60m)", () => {
      const cheaperFast = makeRow({ totalCost: 1_500_000, durationMinutes: 120, stops: 0 });
      const expensiveSlow = makeRow({ totalCost: 2_500_000, durationMinutes: 240, stops: 0 });

      const explanation = explainTradeoff(cheaperFast, expensiveSlow);
      expect(explanation).toBe("Rẻ hơn khoảng 1 triệu và bay nhanh hơn.");
    });

    it("reports equivalent journey when duration and stops differences are minor or zero", () => {
      const cheaper = makeRow({ totalCost: 1_800_000, durationMinutes: 130, stops: 0 });
      const slightlyMore = makeRow({ totalCost: 2_200_000, durationMinutes: 120, stops: 0 });

      const explanation = explainTradeoff(cheaper, slightlyMore);
      expect(explanation).toBe("Rẻ hơn khoảng 400k với hành trình tương đương.");
    });
  });

  describe("identifyDominatedOptions (Pareto efficiency)", () => {
    it("identifies Pareto-dominated options where an alternative is cheaper, faster, and fewer stops", () => {
      const superior: DealComparisonRow = {
        id: "opt-superior",
        route: "HAN → SIN",
        ticketPrice: 2_000_000,
        totalCost: 2_000_000,
        durationMinutes: 180,
        stops: 0,
        refundPolicy: undefined,
        risk: "low",
      };
      const dominated: DealComparisonRow = {
        id: "opt-dominated",
        route: "HAN → SIN",
        ticketPrice: 2_500_000,
        totalCost: 2_500_000,
        durationMinutes: 360,
        stops: 1,
        refundPolicy: undefined,
        risk: "medium",
      };
      const tradeOff: DealComparisonRow = {
        id: "opt-cheapest-slow",
        route: "HAN → SIN",
        ticketPrice: 1_200_000,
        totalCost: 1_200_000,
        durationMinutes: 480,
        stops: 1,
        refundPolicy: undefined,
        risk: "medium",
      };

      const dominatedSet = identifyDominatedOptions([superior, dominated, tradeOff]);
      expect(dominatedSet.has("opt-dominated")).toBe(true);
      expect(dominatedSet.has("opt-superior")).toBe(false);
      expect(dominatedSet.has("opt-cheapest-slow")).toBe(false);
    });

    it("treats undefined duration as Infinity, preventing incomplete options from dominating complete ones", () => {
      const completeOption: DealComparisonRow = {
        id: "opt-complete",
        route: "HAN → DAD",
        ticketPrice: 1_000_000,
        totalCost: 1_000_000,
        durationMinutes: 80,
        stops: 0,
        refundPolicy: undefined,
        risk: "low",
      };
      const missingDuration: DealComparisonRow = {
        id: "opt-missing-dur",
        route: "HAN → DAD",
        ticketPrice: 900_000,
        totalCost: 900_000,
        durationMinutes: undefined,
        stops: 0,
        refundPolicy: undefined,
        risk: "low",
      };

      const dominated = identifyDominatedOptions([completeOption, missingDuration]);
      // opt-missing-dur cannot dominate completeOption because duration is Infinity
      expect(dominated.has("opt-complete")).toBe(false);
    });

    it("returns empty set when given empty rows or single option", () => {
      expect(identifyDominatedOptions([])).toEqual(new Set());
      expect(
        identifyDominatedOptions([
          {
            id: "solo",
            route: "A → B",
            ticketPrice: 100,
            totalCost: 100,
            durationMinutes: 60,
            stops: 0,
            refundPolicy: undefined,
            risk: "low",
          },
        ]),
      ).toEqual(new Set());
    });

    it("identifies transitive domination chains across multi-tier option hierarchies", () => {
      const topTier: DealComparisonRow = {
        id: "opt-A",
        route: "HAN → BKK",
        ticketPrice: 1_500_000,
        totalCost: 1_500_000,
        durationMinutes: 120,
        stops: 0,
        refundPolicy: undefined,
        risk: "low",
      };
      const midTier: DealComparisonRow = {
        id: "opt-B",
        route: "HAN → BKK",
        ticketPrice: 2_000_000,
        totalCost: 2_000_000,
        durationMinutes: 180,
        stops: 1,
        refundPolicy: undefined,
        risk: "medium",
      };
      const lowTier: DealComparisonRow = {
        id: "opt-C",
        route: "HAN → BKK",
        ticketPrice: 2_500_000,
        totalCost: 2_500_000,
        durationMinutes: 240,
        stops: 2,
        refundPolicy: undefined,
        risk: "high",
      };

      const dominatedSet = identifyDominatedOptions([topTier, midTier, lowTier]);
      expect(dominatedSet.has("opt-A")).toBe(false);
      expect(dominatedSet.has("opt-B")).toBe(true);
      expect(dominatedSet.has("opt-C")).toBe(true);
    });

    it("evaluates 100 flight options in Pareto dominance check within sub-50ms latency budget", () => {
      const rows: DealComparisonRow[] = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-opt-${i}`,
        route: "HAN → NRT",
        ticketPrice: 3_000_000 + i * 20_000,
        totalCost: 3_000_000 + i * 20_000,
        durationMinutes: 300 + (i % 10) * 15,
        stops: i % 3,
        refundPolicy: undefined,
        risk: "low",
      }));

      const start = performance.now();
      const dominated = identifyDominatedOptions(rows);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(dominated.size).toBeGreaterThan(0);
      expect(dominated.has("perf-opt-0")).toBe(false); // Cheapest direct flight is not dominated
    });

    it("handles empty deal collections in compareDeals cleanly", () => {
      expect(compareDeals([])).toEqual([]);
    });

    it("preserves pure immutability on Object.freeze protected deal comparison rows", () => {
      const frozenRowA = Object.freeze({
        id: "fr-A",
        route: "HAN → SIN",
        ticketPrice: 2_000_000,
        totalCost: 2_000_000,
        durationMinutes: 180,
        stops: 0,
        refundPolicy: undefined,
        risk: "low" as const,
      });

      const frozenRowB = Object.freeze({
        id: "fr-B",
        route: "HAN → SIN",
        ticketPrice: 2_500_000,
        totalCost: 2_500_000,
        durationMinutes: 240,
        stops: 1,
        refundPolicy: undefined,
        risk: "medium" as const,
      });

      const pool = Object.freeze([frozenRowA, frozenRowB]);

      expect(() => identifyDominatedOptions(pool as any)).not.toThrow();
      expect(() => explainTradeoff(frozenRowA, frozenRowB)).not.toThrow();
      expect(frozenRowA.ticketPrice).toBe(2_000_000);
    });
  });
});
