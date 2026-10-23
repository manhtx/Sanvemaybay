import { describe, expect, it } from 'vitest';
import {
  evaluatePartnerCommercialViability,
  assertCommercialEnablementIntegrity,
  UnauthorizedCommercialSourceError,
  PartnerCommercialProfile,
} from './partnerIntegrations';

describe('F47: Partner Integrations & Commercial Enablement Governance', () => {
  const viableAffiliateProfile: PartnerCommercialProfile = {
    providerId: 'traveloka_affiliate',
    providerName: 'Traveloka Affiliate',
    hasActiveCommercialAgreement: false,
    hasAffiliateRights: true,
    isScrapingPermitted: true,
    isRestrictedOrBlocked: false,
    historicalSuccessRatePercent: 99.1,
    averageLatencyMs: 1400,
    supportsLiveRepricing: true,
    estimatedRevenuePerBookingVND: 120_000,
    marginalQueryCostVND: 500, // 500₫ per query
    expectedQueriesPerBooking: 30, // 30 queries * 500₫ = 15,000₫ cost
  };

  it('approves a viable partner with positive unit economics and verified rights', () => {
    const evaluation = evaluatePartnerCommercialViability(viableAffiliateProfile);

    expect(evaluation.isCommerciallyEnabled).toBe(true);
    expect(evaluation.commercialTier).toBe('APPROVED_AFFILIATE_PARTNER');
    expect(evaluation.unitEconomics.isEconomicallyViable).toBe(true);
    expect(evaluation.unitEconomics.marginalRoi).toBe(8.0); // 120k / 15k = 8.0
    expect(evaluation.disqualificationReasons).toHaveLength(0);
    expect(() => assertCommercialEnablementIntegrity(evaluation)).not.toThrow();
  });

  it('disqualifies a partner with negative unit economics (cost exceeds revenue)', () => {
    const uneconomicProfile: PartnerCommercialProfile = {
      ...viableAffiliateProfile,
      providerId: 'expensive_gds_api',
      estimatedRevenuePerBookingVND: 50_000,
      marginalQueryCostVND: 3_000,
      expectedQueriesPerBooking: 40, // 40 * 3,000₫ = 120,000₫ cost > 50,000₫ revenue
    };

    const evaluation = evaluatePartnerCommercialViability(uneconomicProfile);

    expect(evaluation.isCommerciallyEnabled).toBe(false);
    expect(evaluation.commercialTier).toBe('DISQUALIFIED_INDICATIVE_ONLY');
    expect(evaluation.unitEconomics.isEconomicallyViable).toBe(false);
    expect(evaluation.disqualificationReasons[0]).toContain('Hiệu quả kinh tế âm');
  });

  it('disqualifies a partner lacking legal/commercial scraping rights', () => {
    const noRightsProfile: PartnerCommercialProfile = {
      ...viableAffiliateProfile,
      providerId: 'unauthorized_scraped_source',
      hasActiveCommercialAgreement: false,
      hasAffiliateRights: false, // NO RIGHTS
      isScrapingPermitted: false,
    };

    const evaluation = evaluatePartnerCommercialViability(noRightsProfile);

    expect(evaluation.isCommerciallyEnabled).toBe(false);
    expect(evaluation.commercialTier).toBe('DISQUALIFIED_INDICATIVE_ONLY');
    expect(evaluation.disqualificationReasons.some((r) => r.includes('Thiếu thỏa thuận thương mại'))).toBe(true);
  });

  it('disqualifies a partner failing operational reliability SLAs', () => {
    const unreliableProfile: PartnerCommercialProfile = {
      ...viableAffiliateProfile,
      providerId: 'unstable_partner',
      historicalSuccessRatePercent: 78.0, // < 90%
      averageLatencyMs: 9500, // > 6000ms
    };

    const evaluation = evaluatePartnerCommercialViability(unreliableProfile);

    expect(evaluation.isCommerciallyEnabled).toBe(false);
    expect(evaluation.disqualificationReasons.some((r) => r.includes('Tỷ lệ thành công'))).toBe(true);
    expect(evaluation.disqualificationReasons.some((r) => r.includes('Độ trễ phản hồi'))).toBe(true);
  });

  it('throws UnauthorizedCommercialSourceError when assertCommercialEnablementIntegrity encounters fraudulent enablement', () => {
    const fraudulentEvaluation = {
      providerId: 'bad_partner',
      isCommerciallyEnabled: true, // ILLEGITIMATELY FORCED TO TRUE
      commercialTier: 'APPROVED_AFFILIATE_PARTNER' as any,
      disqualificationReasons: ['Thiếu thỏa thuận thương mại hoặc quyền tiếp thị liên kết hợp lệ.'],
      unitEconomics: {
        totalCostPerBookingVND: 100_000,
        netMarginPerBookingVND: -50_000,
        marginalRoi: 0.5,
        isEconomicallyViable: false,
      },
      reliability: {
        isReliabilitySlaMet: false,
        slaNoteVi: 'Fail',
      },
    };

    expect(() => assertCommercialEnablementIntegrity(fraudulentEvaluation)).toThrow(
      UnauthorizedCommercialSourceError
    );
  });
});
