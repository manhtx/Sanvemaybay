/**
 * FARELY DATA ECONOMICS OPTIMIZER
 * 
 * Satisfies:
 * - F88 (P2): Data economics optimizer
 * 
 * INVARIANTS:
 * - "No scan expansion without measured marginal value."
 * - Track cost per scanned scope, eligible offer, verified opportunity, and useful Watch event.
 * - Reject route or frequency scan expansions whose marginal infrastructure/API cost exceeds measured user or business utility.
 */

export interface ScopeEconomicMetrics {
  routeScope: string;
  scannedScopesCount: number;
  totalScanCostVnd: number;
  eligibleOffersFound: number;
  verifiedOpportunitiesFound: number;
  usefulWatchEventsDispatched: number;
}

export interface UnitEconomicsSummary {
  costPerScannedScopeVnd: number;
  costPerEligibleOfferVnd: number;
  costPerVerifiedOpportunityVnd: number;
  costPerUsefulWatchEventVnd: number;
  eligibleOfferRatePercent: number;
  verifiedOpportunityYieldPercent: number;
}

export interface ScanExpansionProposal {
  routeScope: string;
  additionalScopesCount: number;
  estimatedCostPerScopeVnd: number;
  activeWatchSubscribersCount: number;
  estimatedUsefulAlertValueVnd?: number; // Value in VND of delivering a useful match to an active watch
  historicalOpportunityYieldPercent: number;
  estimatedOpportunityValueVnd?: number;
}

export type ExpansionDecisionStatus = "APPROVED_VALUE_ACCRETIVE" | "REJECTED_UNECONOMIC" | "INSUFFICIENT_EVIDENCE";

export interface ScanExpansionDecision {
  status: ExpansionDecisionStatus;
  marginalCostVnd: number;
  estimatedMarginalValueVnd: number;
  marginalRoiRatio: number; // Value / Cost
  rejectionReasonVi?: string;
  approvalJustificationVi?: string;
}

export class UneconomicScanExpansionError extends Error {
  constructor(reason: string) {
    super(`F88 Invariant Violation: ${reason}`);
    this.name = "UneconomicScanExpansionError";
  }
}

/**
 * Computes safe integer unit cost with a 1 VND minimum floor for non-zero cost batches.
 */
export function computeSafeUnitCostVnd(totalCostVnd: number, totalScans: number): number {
  if (!Number.isFinite(totalCostVnd) || totalCostVnd <= 0 || !Number.isFinite(totalScans) || totalScans <= 0) return 0;
  return Math.max(1, Math.round(totalCostVnd / totalScans));
}

/**
 * Calculates historical unit economics across a scanned dataset.
 */
export function calculateUnitEconomics(metrics: ScopeEconomicMetrics): UnitEconomicsSummary {
  const scans = Math.floor(Math.max(1, Number.isFinite(metrics.scannedScopesCount) ? metrics.scannedScopesCount : 1));
  const cost = Math.max(0, Number.isFinite(metrics.totalScanCostVnd) ? metrics.totalScanCostVnd : 0);
  const offers = Math.max(0, Number.isFinite(metrics.eligibleOffersFound) ? metrics.eligibleOffersFound : 0);
  const opps = Math.max(0, Number.isFinite(metrics.verifiedOpportunitiesFound) ? metrics.verifiedOpportunitiesFound : 0);
  const alerts = Math.max(0, Number.isFinite(metrics.usefulWatchEventsDispatched) ? metrics.usefulWatchEventsDispatched : 0);

  // SOL-BUDGET-01: When positive cost is incurred, enforce an integer minimum floor of 1 VND to prevent zero-cost rate leakage.
  const costPerScannedScopeVnd = cost > 0 && scans > 0 ? Math.max(1, Math.round(cost / scans)) : 0;
  const costPerEligibleOfferVnd = cost > 0 && offers > 0 ? Math.max(1, Math.round(cost / offers)) : (offers > 0 ? 0 : cost);
  const costPerVerifiedOpportunityVnd = cost > 0 && opps > 0 ? Math.max(1, Math.round(cost / opps)) : (opps > 0 ? 0 : cost);
  const costPerUsefulWatchEventVnd = cost > 0 && alerts > 0 ? Math.max(1, Math.round(cost / alerts)) : (alerts > 0 ? 0 : cost);

  return {
    costPerScannedScopeVnd,
    costPerEligibleOfferVnd,
    costPerVerifiedOpportunityVnd,
    costPerUsefulWatchEventVnd,
    eligibleOfferRatePercent: Math.round((offers / scans) * 100),
    verifiedOpportunityYieldPercent: Math.round((opps / scans) * 100),
  };
}

/**
 * F88 INVARIANT: Evaluates whether expanding scan scope is economically justified.
 * Refuses expansion when marginal cost exceeds measured marginal utility.
 */
export function evaluateScanExpansionProposal(
  proposal: ScanExpansionProposal
): ScanExpansionDecision {
  const safeScopes = Math.floor(Math.max(0, proposal.additionalScopesCount || 0));
  const safeCostPerScope = Math.max(0, proposal.estimatedCostPerScopeVnd || 0);
  const rawMarginalCost = safeScopes * safeCostPerScope;
  const marginalCostVnd = Math.min(Number.MAX_SAFE_INTEGER, Math.round(rawMarginalCost));

  if (marginalCostVnd <= 0 || safeScopes <= 0) {
    return {
      status: "REJECTED_UNECONOMIC",
      marginalCostVnd: 0,
      estimatedMarginalValueVnd: 0,
      marginalRoiRatio: 0,
      rejectionReasonVi: "Chi phí mở rộng không hợp lệ hoặc số lượng phạm vi quét bổ sung bằng 0.",
    };
  }

  // AUD-13 & F88 Invariant: Reject scan expansion when marginal utility lacks measured empirical evidence.
  // Never inject default benchmark values (e.g. 20k/10k) to fabricate positive ROI without proof.
  if (
    proposal.estimatedUsefulAlertValueVnd === undefined &&
    proposal.estimatedOpportunityValueVnd === undefined
  ) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      marginalCostVnd,
      estimatedMarginalValueVnd: 0,
      marginalRoiRatio: 0,
      rejectionReasonVi: `Mở rộng quét bị bảo lưu (INSUFFICIENT_EVIDENCE): thiếu bằng chứng đo lường giá trị biên thực tế (chưa cung cấp estimatedUsefulAlertValueVnd hoặc estimatedOpportunityValueVnd). Tuân thủ F88 & AUD-V34-10: không tự ý gán giá trị mặc định khi chưa có dữ liệu đo lường, và phân biệt rõ ràng giữa thiếu bằng chứng với trường hợp đã chứng minh ROI âm.`,
    };
  }

  const alertValue = Math.max(0, proposal.estimatedUsefulAlertValueVnd ?? 0);
  const opportunityValue = Math.max(0, proposal.estimatedOpportunityValueVnd ?? 0);
  const safeSubscribers = Math.floor(Math.max(0, proposal.activeWatchSubscribersCount || 0));
  const safeYieldPercent = Math.min(100, Math.max(0, proposal.historicalOpportunityYieldPercent || 0));

  // Expected opportunities from new scans
  const expectedNewOpps = safeScopes * (safeYieldPercent / 100);

  // Expected value = (active subscribers benefiting * alertValue) + (expected new opps * opportunityValue)
  const estimatedMarginalValueVnd = Math.round(
    safeSubscribers * alertValue + expectedNewOpps * opportunityValue
  );

  const marginalRoiRatio = marginalCostVnd > 0
    ? Math.round((estimatedMarginalValueVnd / marginalCostVnd) * 100) / 100
    : 0;

  if (marginalRoiRatio < 1.0) {
    return {
      status: "REJECTED_UNECONOMIC",
      marginalCostVnd,
      estimatedMarginalValueVnd,
      marginalRoiRatio,
      rejectionReasonVi: `Mở rộng quét không hiệu quả kinh tế (ROI dự kiến ${marginalRoiRatio} < 1.0; chi phí biên ${marginalCostVnd.toLocaleString("vi-VN")}đ vượt quá giá trị người dùng dự kiến ${estimatedMarginalValueVnd.toLocaleString("vi-VN")}đ cho tuyến ${proposal.routeScope}). Tuân thủ F88: từ chối mở rộng quét khi chưa có đủ nhu cầu người dùng thực tế.`,
    };
  }

  return {
    status: "APPROVED_VALUE_ACCRETIVE",
    marginalCostVnd,
    estimatedMarginalValueVnd,
    marginalRoiRatio,
    approvalJustificationVi: `Mở rộng quét mang lại giá trị gia tăng rõ rệt (ROI ${marginalRoiRatio} >= 1.0) với ${safeSubscribers} người dùng đang chủ động theo dõi tuyến ${proposal.routeScope}.`,
  };
}
