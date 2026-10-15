import { describe, it, expect } from "vitest";
import {
  calculateUnitEconomics,
  evaluateScanExpansionProposal,
  ScanExpansionProposal,
  ScopeEconomicMetrics,
} from "./dataEconomics";

describe("Data Economics Optimizer (F88)", () => {
  describe("calculateUnitEconomics", () => {
    it("computes accurate unit costs and yields", () => {
      const metrics: ScopeEconomicMetrics = {
        routeScope: "HAN-BKK",
        scannedScopesCount: 1000,
        totalScanCostVnd: 500_000, // 500 VND per scan
        eligibleOffersFound: 800,
        verifiedOpportunitiesFound: 100,
        usefulWatchEventsDispatched: 50,
      };

      const summary = calculateUnitEconomics(metrics);
      expect(summary.costPerScannedScopeVnd).toBe(500);
      expect(summary.costPerEligibleOfferVnd).toBe(625);
      expect(summary.costPerVerifiedOpportunityVnd).toBe(5_000);
      expect(summary.costPerUsefulWatchEventVnd).toBe(10_000);
      expect(summary.eligibleOfferRatePercent).toBe(80);
      expect(summary.verifiedOpportunityYieldPercent).toBe(10);
    });
  });

  describe("F88 Invariant: evaluateScanExpansionProposal", () => {
    it("rejects uneconomic scan expansion when marginal cost exceeds marginal utility", () => {
      // Proposing to scan 1,000 new date slices for an obscure route with ZERO active watch subscribers
      const proposal: ScanExpansionProposal = {
        routeScope: "VKG-BMV", // Rach Gia to Buon Ma Thuot
        additionalScopesCount: 1000,
        estimatedCostPerScopeVnd: 500, // Marginal cost = 500,000 VND
        activeWatchSubscribersCount: 0, // No user demand!
        historicalOpportunityYieldPercent: 2, // 20 expected opportunities * 10,000 VND = 200,000 VND
      };

      const decision = evaluateScanExpansionProposal(proposal);
      expect(decision.status).toBe("REJECTED_UNECONOMIC");
      expect(decision.marginalRoiRatio).toBeLessThan(1.0);
      expect(decision.rejectionReasonVi).toContain("Mở rộng quét không hiệu quả kinh tế");
      expect(decision.rejectionReasonVi).toContain("Tuân thủ F88");
    });

    it("approves value-accretive scan expansion when active user demand justifies marginal cost", () => {
      // Proposing 200 additional scans for a high-demand route with 50 active subscribers
      const proposal: ScanExpansionProposal = {
        routeScope: "HAN-DAD",
        additionalScopesCount: 200,
        estimatedCostPerScopeVnd: 500, // Marginal cost = 100,000 VND
        activeWatchSubscribersCount: 50, // 50 * 20,000 VND = 1,000,000 VND utility
        historicalOpportunityYieldPercent: 10,
      };

      const decision = evaluateScanExpansionProposal(proposal);
      expect(decision.status).toBe("APPROVED_VALUE_ACCRETIVE");
      expect(decision.marginalRoiRatio).toBeGreaterThanOrEqual(1.0);
      expect(decision.approvalJustificationVi).toContain("giá trị gia tăng rõ rệt");
    });
  });
});
