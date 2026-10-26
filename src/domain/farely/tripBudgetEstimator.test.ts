import { describe, expect, it } from "vitest";
import {
  estimateTotalTripCost,
  calculateLandedFlightCost,
  estimateRoundTripBaggageCost,
  calculateCarrierLandedSurcharges,
} from "./tripBudgetEstimator";

describe("Trip Budget Estimator (F46)", () => {
  it("calculates realistic estimated total cost for Phu Quoc trip", () => {
    const airfare = 2_400_000;
    const estimate = estimateTotalTripCost({
      destinationCode: "PQC",
      airfareTotal: airfare,
      nights: 3,
      travelers: 2,
      style: "standard",
    });

    expect(estimate.destinationCode).toBe("PQC");
    expect(estimate.destinationName).toBe("Phú Quốc");
    expect(estimate.airfareTotal).toBe(airfare);
    // 1 room needed for 2 travelers, standard lodging is 1,000,000 * 3 nights = 3,000,000
    expect(estimate.lodgingTotalEstimated).toBe(3_000_000);
    // Transfer: standard is 180,000 * 2 = 360,000
    expect(estimate.groundTransferEstimated).toBe(360_000);
    // Daily expenses: 600,000 * 4 days * 2 travelers = 4,800,000
    expect(estimate.dailyExpensesEstimated).toBe(4_800_000);
    expect(estimate.grandTotalEstimated).toBe(airfare + 3_000_000 + 360_000 + 4_800_000);
    expect(estimate.uncertainty).toBe("ESTIMATED");
    expect(estimate.disclosureVi).toContain("ước tính tham khảo");
  });

  it("adjusts costs accurately across budget vs comfort styles", () => {
    const budget = estimateTotalTripCost({
      destinationCode: "DAD",
      airfareTotal: 1_500_000,
      nights: 2,
      travelers: 1,
      style: "budget",
    });

    const comfort = estimateTotalTripCost({
      destinationCode: "DAD",
      airfareTotal: 1_500_000,
      nights: 2,
      travelers: 1,
      style: "comfort",
    });

    expect(budget.grandTotalEstimated).toBeLessThan(comfort.grandTotalEstimated);
    expect(budget.lodgingTotalEstimated).toBeLessThan(comfort.lodgingTotalEstimated);
  });

  it("handles unindexed fallback destinations safely without crashing", () => {
    const estimate = estimateTotalTripCost({
      destinationCode: "UNKNOWN_CITY",
      airfareTotal: 2_000_000,
      nights: 2,
      travelers: 1,
    });

    expect(estimate.destinationCode).toBe("UNKNOWN_CITY");
    expect(estimate.grandTotalEstimated).toBeGreaterThan(2_000_000);
    expect(estimate.uncertainty).toBe("ESTIMATED");
  });

  describe("SOL-03: Carrier Landed Cost & Round-Trip Baggage Estimation", () => {
    it("calculates round-trip baggage cost accurately for low-cost carriers", () => {
      // VJ: 350,000 VND / piece * 1 bag * 2 ways = 700,000 VND
      expect(estimateRoundTripBaggageCost("VJ", 1)).toBe(700_000);
      // QH: 320,000 VND / piece * 2 bags * 2 ways = 1,280,000 VND
      expect(estimateRoundTripBaggageCost("QH", 2)).toBe(1_280_000);
      // VU: 300,000 VND / piece * 1 bag * 2 ways = 600,000 VND
      expect(estimateRoundTripBaggageCost("VU", 1)).toBe(600_000);
      // VN: 0 VND included
      expect(estimateRoundTripBaggageCost("VN", 1)).toBe(0);
    });

    it("calculates landed flight cost including mandatory fees and baggage", () => {
      const landedVJ = calculateLandedFlightCost({
        airlineCode: "VJ",
        baseFare: 1_000_000,
        includeBaggage: true,
      });
      // 1,000,000 + 350,000 + 55,000 = 1,405,000 VND
      expect(landedVJ).toBe(1_405_000);
    });

    it("sanitizes passenger and leg quantities in calculateCarrierLandedSurcharges", () => {
      const surcharges = calculateCarrierLandedSurcharges("VJ", 2.8, 2);
      expect(surcharges.baggageFee).toBe(350_000 * 2 * 2);
      expect(surcharges.ticketingFee).toBe(55_000 * 2 * 2);

      const fallback = calculateCarrierLandedSurcharges("VJ", NaN, -1);
      expect(fallback.baggageFee).toBe(350_000 * 1 * 1);
      expect(fallback.ticketingFee).toBe(55_000 * 1 * 1);

      const roundTripSafe = estimateRoundTripBaggageCost("VJ", -3);
      expect(roundTripSafe).toBe(350_000 * 1 * 2);
    });
  });
});

