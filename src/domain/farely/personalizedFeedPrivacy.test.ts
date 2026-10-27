import { describe, expect, it } from 'vitest';
import {
  rankFeedWithPrivacyGuarantees,
  sanitizePersonalizationContext,
  CovertProfilingViolationError,
  FeedCandidateDeal,
  ExplicitUserPreferences,
} from './personalizedFeedPrivacy';

describe('F38: Personalized Travel Feed Privacy & Non-Profiling', () => {
  const deals: FeedCandidateDeal[] = [
    {
      id: 'deal_han_dad',
      originCode: 'HAN',
      destinationCode: 'DAD',
      airlineCode: 'VN',
      priceVND: 1_200_000,
      objectiveDealScore: 80,
      stops: 0,
    },
    {
      id: 'deal_sgn_bkk',
      originCode: 'SGN',
      destinationCode: 'BKK',
      airlineCode: 'VJ',
      priceVND: 1_500_000,
      objectiveDealScore: 90, // Higher objective score
      stops: 0,
    },
  ];

  it('ranks purely by objective DealScore when personalization is not opted in', () => {
    const preferences: ExplicitUserPreferences = {
      isPersonalizationOptedIn: false,
      homeAirports: ['HAN'], // Even if set, must not be used without opt-in
    };

    const result = rankFeedWithPrivacyGuarantees({ deals, preferences });

    expect(result[0].deal.id).toBe('deal_sgn_bkk'); // 90 > 80
    expect(result[0].isPersonalizedPromotion).toBe(false);
    expect(result[0].rankingRationaleVi).toContain('khách quan');
  });

  it('elevates explicitly matching deals when user explicitly opted in', () => {
    const preferences: ExplicitUserPreferences = {
      isPersonalizationOptedIn: true,
      homeAirports: ['HAN'],
      preferredAirlines: ['VN'],
    };

    const result = rankFeedWithPrivacyGuarantees({ deals, preferences });

    // HAN + VN elevates deal_han_dad (80 + 20 + 15 = 115) over deal_sgn_bkk (90)
    expect(result[0].deal.id).toBe('deal_han_dad');
    expect(result[0].isPersonalizedPromotion).toBe(true);
    expect(result[0].rankingRationaleVi).toContain('Hãng bay ưu thích (VN)');
  });

  it('throws CovertProfilingViolationError when context contains forbidden demographic or covert profiling traits', () => {
    expect(() =>
      sanitizePersonalizationContext({
        inferredIncomeTier: 'HIGH_AFFLUENT',
      })
    ).toThrow(CovertProfilingViolationError);

    expect(() =>
      sanitizePersonalizationContext({
        covertDeviceFingerprint: 'canvas_hash_98124',
      })
    ).toThrow(CovertProfilingViolationError);

    expect(() =>
      sanitizePersonalizationContext({
        inferredReligion: 'BUDDHISM',
      })
    ).toThrow(CovertProfilingViolationError);
  });

  it('throws CovertProfilingViolationError during feed ranking if prohibited context is passed', () => {
    const preferences: ExplicitUserPreferences = {
      isPersonalizationOptedIn: true,
    };

    expect(() =>
      rankFeedWithPrivacyGuarantees({
        deals,
        preferences,
        contextPayload: {
          surveillanceCohortId: 'cohort_demographic_77',
        },
      })
    ).toThrow(CovertProfilingViolationError);
  });

  it('detects sensitive profiling keys in nested objects and arrays with normalized key variants (L05/L07)', () => {
    // Nested object with snake_case
    expect(() =>
      sanitizePersonalizationContext({
        userMeta: {
          demographics: {
            inferred_income_tier: 'TOP_5_PERCENT',
          },
        },
      })
    ).toThrow(CovertProfilingViolationError);

    // Nested array with kebab-case
    expect(() =>
      sanitizePersonalizationContext({
        history: [
          { tag: 'vietnam' },
          { 'inferred-political-stance': 'CENTRIST' },
        ],
      })
    ).toThrow(CovertProfilingViolationError);
  });

  it('handles cyclical references safely without stack overflow (L05/L07)', () => {
    const circularObj: any = { safeField: 'travel_lover' };
    circularObj.self = circularObj;

    expect(() => sanitizePersonalizationContext(circularObj)).not.toThrow();
  });

  it('ignores prototype pollution keys safely (L05)', () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "safeKey": "value"}');
    expect(() => sanitizePersonalizationContext(maliciousPayload)).not.toThrow();
  });

  it('strictly requires boolean true for affirmative consent under Decree 13/2023/ND-CP (L06)', () => {
    // Truthy string "true" or "yes" is NOT boolean true
    const pseudoConsentPreferences: any = {
      isPersonalizationOptedIn: 'true',
      homeAirports: ['HAN'],
    };

    const result = rankFeedWithPrivacyGuarantees({ deals, preferences: pseudoConsentPreferences });

    // Should fall back to objective ranking (90 > 80)
    expect(result[0].deal.id).toBe('deal_sgn_bkk');
    expect(result[0].isPersonalizedPromotion).toBe(false);
  });
});
