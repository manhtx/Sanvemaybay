import { describe, it, expect } from "vitest";
import {
  calculateUnitEconomics,
  evaluateScanExpansionProposal,
  computeSafeUnitCostVnd,
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

    it("enforces a 1 VND minimum integer floor on unit scan cost for non-zero batches (SOL-BUDGET-01)", () => {
      // 100 VND across 10,000 scans = 0.01 VND/scan. Naive round would be 0 VND!
      const fractionalBatch: ScopeEconomicMetrics = {
        routeScope: "SGN-UIH",
        scannedScopesCount: 10_000,
        totalScanCostVnd: 100,
        eligibleOffersFound: 5_000,
        verifiedOpportunitiesFound: 500,
        usefulWatchEventsDispatched: 100,
      };

      const summary = calculateUnitEconomics(fractionalBatch);
      expect(summary.costPerScannedScopeVnd).toBe(1); // Enforced 1 VND floor
      expect(summary.costPerEligibleOfferVnd).toBe(1);
      expect(computeSafeUnitCostVnd(100, 10_000)).toBe(1);
      expect(computeSafeUnitCostVnd(0, 10_000)).toBe(0);
      expect(computeSafeUnitCostVnd(100, 0)).toBe(0);
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
        estimatedOpportunityValueVnd: 10_000,
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
        estimatedUsefulAlertValueVnd: 20_000,
        historicalOpportunityYieldPercent: 10,
        estimatedOpportunityValueVnd: 10_000,
      };

      const decision = evaluateScanExpansionProposal(proposal);
      expect(decision.status).toBe("APPROVED_VALUE_ACCRETIVE");
      expect(decision.marginalRoiRatio).toBeGreaterThanOrEqual(1.0);
      expect(decision.approvalJustificationVi).toContain("giá trị gia tăng rõ rệt");
    });

    it("AUD-13: rejects scan expansion when measured utility evidence is omitted without fabricating default values", () => {
      const proposalWithoutEvidence: ScanExpansionProposal = {
        routeScope: "SGN-HAN",
        additionalScopesCount: 100,
        estimatedCostPerScopeVnd: 500,
        activeWatchSubscribersCount: 10,
        historicalOpportunityYieldPercent: 5,
        // estimatedUsefulAlertValueVnd and estimatedOpportunityValueVnd are omitted!
      };

      const decision = evaluateScanExpansionProposal(proposalWithoutEvidence);
      expect(decision.status).toBe("INSUFFICIENT_EVIDENCE");
      expect(decision.marginalRoiRatio).toBe(0);
      expect(decision.estimatedMarginalValueVnd).toBe(0);
      expect(decision.rejectionReasonVi).toContain("thiếu bằng chứng đo lường");
    });

    it("rejects zero or negative scope expansions and clamps metrics defensively", () => {
      const zeroScopeProposal: ScanExpansionProposal = {
        routeScope: "HAN-CXR",
        additionalScopesCount: 0,
        estimatedCostPerScopeVnd: 500,
        activeWatchSubscribersCount: 20,
        estimatedUsefulAlertValueVnd: 20_000,
        historicalOpportunityYieldPercent: 10,
        estimatedOpportunityValueVnd: 10_000,
      };

      const decision = evaluateScanExpansionProposal(zeroScopeProposal);
      expect(decision.status).toBe("REJECTED_UNECONOMIC");
      expect(decision.marginalCostVnd).toBe(0);
      expect(decision.marginalRoiRatio).toBe(0);
      expect(decision.rejectionReasonVi).toContain("không hợp lệ hoặc số lượng phạm vi quét bổ sung bằng 0");
    });
  });
});
