/**
 * F47: Partner Integrations & Commercial Enablement Governance (Tier P2)
 *
 * Requirements:
 * - Solution: Provider capability, live repricing, commercial permission, reliability and unit-economics evaluation.
 * - Acceptance Invariant: No source enabled commercially without supporting rights and economics.
 */

export class UnauthorizedCommercialSourceError extends Error {
  constructor(message: string) {
    super(`[F47_UNAUTHORIZED_COMMERCIAL_SOURCE_VIOLATION] ${message}`);
    this.name = 'UnauthorizedCommercialSourceError';
  }
}

export interface PartnerCommercialProfile {
  providerId: string;
  providerName: string;
  hasActiveCommercialAgreement: boolean;
  hasAffiliateRights: boolean;
  isScrapingPermitted: boolean;
  isRestrictedOrBlocked: boolean;
  // Reliability metrics
  historicalSuccessRatePercent: number; // e.g. 98.5%
  averageLatencyMs: number;              // e.g. 1200ms
  supportsLiveRepricing: boolean;
  // Unit economics
  estimatedRevenuePerBookingVND: number;
  marginalQueryCostVND: number;          // compute + proxy per query
  expectedQueriesPerBooking: number;      // e.g. 40 queries per 1 booking
}

export type CommercialTier =
  | 'DIRECT_COMMERCIAL_PARTNER'
  | 'APPROVED_AFFILIATE_PARTNER'
  | 'DISQUALIFIED_INDICATIVE_ONLY';

export interface PartnerCommercialEvaluation {
  providerId: string;
  isCommerciallyEnabled: boolean;
  commercialTier: CommercialTier;
  disqualificationReasons: string[];
  unitEconomics: {
    totalCostPerBookingVND: number;
    netMarginPerBookingVND: number;
    marginalRoi: number; // revenue / cost
    isEconomicallyViable: boolean;
  };
  reliability: {
    isReliabilitySlaMet: boolean;
    slaNoteVi: string;
  };
}

const MINIMUM_SUCCESS_RATE_PERCENT = 90.0;
const MAXIMUM_AVERAGE_LATENCY_MS = 6000;
const MINIMUM_ECONOMIC_ROI = 1.0;

/**
 * Evaluates whether a partner provider meets all technical, legal, and economic
 * criteria for commercial enablement (F47).
 */
export function evaluatePartnerCommercialViability(
  profile: PartnerCommercialProfile
): PartnerCommercialEvaluation {
  const disqualificationReasons: string[] = [];

  // 1. Legal and contractual rights check
  if (profile.isRestrictedOrBlocked) {
    disqualificationReasons.push('Nguồn bị hạn chế hoặc có thông báo cấm cào dữ liệu/thương mại hóa.');
  }

  const hasLegalRights =
    profile.hasActiveCommercialAgreement || (profile.hasAffiliateRights && profile.isScrapingPermitted);

  if (!hasLegalRights) {
    disqualificationReasons.push('Thiếu thỏa thuận thương mại hoặc quyền tiếp thị liên kết (Affiliate) hợp lệ.');
  }

  // 2. Reliability & technical performance check (with negative value guards)
  const isSuccessRateValid =
    Number.isFinite(profile.historicalSuccessRatePercent) &&
    profile.historicalSuccessRatePercent >= 0 &&
    profile.historicalSuccessRatePercent <= 100;
  const isLatencyValid =
    Number.isFinite(profile.averageLatencyMs) &&
    profile.averageLatencyMs >= 0;

  const isSuccessRateOk = isSuccessRateValid && profile.historicalSuccessRatePercent >= MINIMUM_SUCCESS_RATE_PERCENT;
  const isLatencyOk = isLatencyValid && profile.averageLatencyMs <= MAXIMUM_AVERAGE_LATENCY_MS;
  const isReliabilitySlaMet = isSuccessRateOk && isLatencyOk;

  if (!isSuccessRateValid || !isSuccessRateOk) {
    disqualificationReasons.push(
      `Tỷ lệ thành công (${profile.historicalSuccessRatePercent}%) thấp hơn ngưỡng yêu cầu ${MINIMUM_SUCCESS_RATE_PERCENT}%.`
    );
  }
  if (!isLatencyValid || !isLatencyOk) {
    disqualificationReasons.push(
      `Độ trễ phản hồi (${profile.averageLatencyMs}ms) không hợp lệ hoặc vượt quá giới hạn tối đa ${MAXIMUM_AVERAGE_LATENCY_MS}ms.`
    );
  }

  // 3. Unit economics check (with finite and non-negative guards)
  const validQueryCost = Math.max(0, Number.isFinite(profile.marginalQueryCostVND) ? profile.marginalQueryCostVND : 0);
  const validQueriesPerBooking = Math.max(0, Number.isFinite(profile.expectedQueriesPerBooking) ? profile.expectedQueriesPerBooking : 0);
  const validRevenue = Number.isFinite(profile.estimatedRevenuePerBookingVND) ? profile.estimatedRevenuePerBookingVND : 0;

  const totalCostPerBookingVND = validQueryCost * validQueriesPerBooking;
  const netMarginPerBookingVND = validRevenue - totalCostPerBookingVND;
  const marginalRoi =
    totalCostPerBookingVND > 0 ? validRevenue / totalCostPerBookingVND : 0;
  const isEconomicallyViable = marginalRoi >= MINIMUM_ECONOMIC_ROI && netMarginPerBookingVND >= 0;

  if (!isEconomicallyViable) {
    disqualificationReasons.push(
      `Hiệu quả kinh tế âm: Chi phí quét (${totalCostPerBookingVND.toLocaleString('vi-VN')}₫) vượt quá doanh thu dự kiến (${validRevenue.toLocaleString('vi-VN')}₫) trên mỗi lượt đặt vé (ROI: ${marginalRoi.toFixed(2)} < 1.0).`
    );
  }

  const isCommerciallyEnabled = disqualificationReasons.length === 0;

  let commercialTier: CommercialTier = 'DISQUALIFIED_INDICATIVE_ONLY';
  if (isCommerciallyEnabled) {
    commercialTier = profile.hasActiveCommercialAgreement
      ? 'DIRECT_COMMERCIAL_PARTNER'
      : 'APPROVED_AFFILIATE_PARTNER';
  }

  return {
    providerId: profile.providerId,
    isCommerciallyEnabled,
    commercialTier,
    disqualificationReasons,
    unitEconomics: {
      totalCostPerBookingVND,
      netMarginPerBookingVND,
      marginalRoi,
      isEconomicallyViable,
    },
    reliability: {
      isReliabilitySlaMet,
      slaNoteVi: isReliabilitySlaMet
        ? `SLA đạt tiêu chuẩn (${profile.historicalSuccessRatePercent}%, ${profile.averageLatencyMs}ms)`
        : `SLA vi phạm tiêu chuẩn Farely P2`,
    },
  };
}

/**
 * Asserts that a provider marked as commercially enabled truly complies with F47.
 * Throws UnauthorizedCommercialSourceError if commercial status was illegally asserted.
 */
export function assertCommercialEnablementIntegrity(
  evaluation: PartnerCommercialEvaluation
): void {
  if (
    evaluation.isCommerciallyEnabled &&
    (!evaluation.unitEconomics.isEconomicallyViable ||
      evaluation.disqualificationReasons.length > 0 ||
      evaluation.commercialTier === 'DISQUALIFIED_INDICATIVE_ONLY')
  ) {
    throw new UnauthorizedCommercialSourceError(
      `Provider "${evaluation.providerId}" cannot be commercially enabled with negative unit economics or DISQUALIFIED tier.`
    );
  }
}
