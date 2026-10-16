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

  // 2. Reliability & technical performance check
  const isSuccessRateOk = profile.historicalSuccessRatePercent >= MINIMUM_SUCCESS_RATE_PERCENT;
  const isLatencyOk = profile.averageLatencyMs <= MAXIMUM_AVERAGE_LATENCY_MS;
  const isReliabilitySlaMet = isSuccessRateOk && isLatencyOk;

  if (!isSuccessRateOk) {
    disqualificationReasons.push(
      `Tỷ lệ thành công (${profile.historicalSuccessRatePercent}%) thấp hơn ngưỡng yêu cầu ${MINIMUM_SUCCESS_RATE_PERCENT}%.`
    );
  }
  if (!isLatencyOk) {
    disqualificationReasons.push(
      `Độ trễ phản hồi (${profile.averageLatencyMs}ms) vượt quá giới hạn tối đa ${MAXIMUM_AVERAGE_LATENCY_MS}ms.`
    );
  }

  // 3. Unit economics check
  const totalCostPerBookingVND = profile.marginalQueryCostVND * profile.expectedQueriesPerBooking;
  const netMarginPerBookingVND = profile.estimatedRevenuePerBookingVND - totalCostPerBookingVND;
  const marginalRoi =
    totalCostPerBookingVND > 0 ? profile.estimatedRevenuePerBookingVND / totalCostPerBookingVND : 0;
  const isEconomicallyViable = marginalRoi >= MINIMUM_ECONOMIC_ROI;

  if (!isEconomicallyViable) {
    disqualificationReasons.push(
      `Hiệu quả kinh tế âm: Chi phí quét (${totalCostPerBookingVND.toLocaleString('vi-VN')}₫) vượt quá doanh thu dự kiến (${profile.estimatedRevenuePerBookingVND.toLocaleString('vi-VN')}₫) trên mỗi lượt đặt vé (ROI: ${marginalRoi.toFixed(2)} < 1.0).`
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
        ? 'Đáp ứng đầy đủ tiêu chuẩn độ trễ và độ tin cậy kết nối.'
        : 'Không đạt tiêu chuẩn SLA vận hành.',
    },
  };
}

/**
 * Asserts that a provider marked as commercially enabled strictly complies with F47 invariants.
 * Throws UnauthorizedCommercialSourceError if commercial enablement was granted without supporting rights or economics.
 */
export function assertCommercialEnablementIntegrity(
  evaluation: PartnerCommercialEvaluation
): void {
  if (evaluation.isCommerciallyEnabled && evaluation.disqualificationReasons.length > 0) {
    throw new UnauthorizedCommercialSourceError(
      `Provider "${evaluation.providerId}" was enabled commercially despite failing criteria: ${evaluation.disqualificationReasons.join(' | ')}`
    );
  }

  if (
    evaluation.isCommerciallyEnabled &&
    (!evaluation.unitEconomics.isEconomicallyViable || evaluation.commercialTier === 'DISQUALIFIED_INDICATIVE_ONLY')
  ) {
    throw new UnauthorizedCommercialSourceError(
      `Provider "${evaluation.providerId}" cannot be commercially enabled with negative unit economics or DISQUALIFIED tier.`
    );
  }
}
