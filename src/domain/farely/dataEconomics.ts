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
 * Calculates historical unit economics across a scanned dataset.
 */
export function calculateUnitEconomics(metrics: ScopeEconomicMetrics): UnitEconomicsSummary {
  const scans = Math.max(1, metrics.scannedScopesCount);
  const cost = Math.max(0, metrics.totalScanCostVnd);
  const offers = Math.max(0, metrics.eligibleOffersFound);
  const opps = Math.max(0, metrics.verifiedOpportunitiesFound);
  const alerts = Math.max(0, metrics.usefulWatchEventsDispatched);

  return {
    costPerScannedScopeVnd: Math.round(cost / scans),
    costPerEligibleOfferVnd: offers > 0 ? Math.round(cost / offers) : cost,
    costPerVerifiedOpportunityVnd: opps > 0 ? Math.round(cost / opps) : cost,
    costPerUsefulWatchEventVnd: alerts > 0 ? Math.round(cost / alerts) : cost,
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
  const marginalCostVnd = proposal.additionalScopesCount * proposal.estimatedCostPerScopeVnd;

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

  const alertValue = proposal.estimatedUsefulAlertValueVnd ?? 0;
  const opportunityValue = proposal.estimatedOpportunityValueVnd ?? 0;

  // Expected opportunities from new scans
  const expectedNewOpps =
    proposal.additionalScopesCount * (proposal.historicalOpportunityYieldPercent / 100);

  // Expected value = (active subscribers benefiting * alertValue) + (expected new opps * opportunityValue)
  const estimatedMarginalValueVnd =
    proposal.activeWatchSubscribersCount * alertValue + expectedNewOpps * opportunityValue;

  const marginalRoiRatio = marginalCostVnd > 0
    ? Math.round((estimatedMarginalValueVnd / marginalCostVnd) * 100) / 100
    : 1.0;

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
    approvalJustificationVi: `Mở rộng quét mang lại giá trị gia tăng rõ rệt (ROI ${marginalRoiRatio} >= 1.0) với ${proposal.activeWatchSubscribersCount} người dùng đang chủ động theo dõi tuyến ${proposal.routeScope}.`,
  };
}
