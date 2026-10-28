import { describe, expect, it } from 'vitest';
import {
  compareProviderChannels,
  assertCommercialRankingIntegrity,
  CommercialRankingOverrideError,
  ProviderQuoteInput,
  isValidDeepLinkUrl,
} from './directAffiliateComparison';

describe('F43: Direct/Affiliate Provider Comparison', () => {
  const directAirlineQuote: ProviderQuoteInput = {
    providerId: 'vna_direct',
    providerName: 'Vietnam Airlines Official',
    channelType: 'DIRECT_AIRLINE',
    quoteBasis: 'BASE_FARE_ONLY',
    rawQuotedPriceVND: 1_200_000,
    mandatoryTaxesAndFeesVND: 450_000,
    checkedBaggageFeeVND: 0,
    isBaggageIncludedInQuote: true, // VNA includes 23kg
    deepLinkClass: 'DEEP_LINK_EXACT_OFFER',
    deepLinkUrl: 'https://www.vietnamairlines.com/booking/123',
    isCommercialPartner: false,
    observedAt: '2026-10-15T02:00:00Z',
  };

  const highPayingOtaQuote: ProviderQuoteInput = {
    providerId: 'ota_sponsored',
    providerName: 'SuperOTA (Sponsored)',
    channelType: 'OTA_PARTNER',
    quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
    rawQuotedPriceVND: 1_800_000,
    mandatoryTaxesAndFeesVND: 0,
    checkedBaggageFeeVND: 250_000,
    isBaggageIncludedInQuote: false,
    deepLinkClass: 'DEEP_LINK_EXACT_OFFER',
    deepLinkUrl: 'https://superota.com/flight/123?ref=farely_vip',
    isCommercialPartner: true,
    affiliateCommissionRatePercent: 8.0, // High paying partner
    observedAt: '2026-10-15T02:00:00Z',
  };

  const discountOtaQuote: ProviderQuoteInput = {
    providerId: 'trip_discount',
    providerName: 'Trip Discount',
    channelType: 'OTA_PARTNER',
    quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
    rawQuotedPriceVND: 1_550_000,
    mandatoryTaxesAndFeesVND: 0,
    checkedBaggageFeeVND: 0,
    isBaggageIncludedInQuote: true,
    deepLinkClass: 'SEARCH_RESULTS_PREFILLED',
    deepLinkUrl: 'https://trip.com/flights/search',
    isCommercialPartner: false,
    observedAt: '2026-10-15T02:00:00Z',
  };

  it('normalizes total costs and designates the true objective cheapest provider', () => {
    // Direct: 1.2M + 450k = 1.65M
    // High Paying OTA: 1.8M
    // Discount OTA: 1.55M
    const result = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [directAirlineQuote, highPayingOtaQuote, discountOtaQuote],
      requiresCheckedBaggage: false,
    });

    expect(result.objectiveCheapestProviderId).toBe('trip_discount');
    expect(result.channels[0].providerId).toBe('trip_discount');
    expect(result.channels[0].normalizedTotalCostVND).toBe(1_550_000);
    expect(result.channels[1].providerId).toBe('vna_direct');
    expect(result.channels[1].normalizedTotalCostVND).toBe(1_650_000);
    expect(result.channels[2].providerId).toBe('ota_sponsored');
    expect(result.channels[2].normalizedTotalCostVND).toBe(1_800_000);
    expect(result.cheapestChannelType).toBe('OTA_PARTNER');
    expect(result.totalChannelsCompared).toBe(3);
    expect(result.isDirectCheaperOrEqual).toBe(false);
  });

  it('adjusts total cost when checked baggage is required', () => {
    // With baggage:
    // Direct: 1.2M + 450k + 0 = 1.65M (already included)
    // Discount OTA: 1.55M + 0 = 1.55M (already included)
    // High Paying OTA: 1.8M + 250k = 2.05M
    const result = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [directAirlineQuote, highPayingOtaQuote, discountOtaQuote],
      requiresCheckedBaggage: true,
    });

    const highPaying = result.channels.find((c) => c.providerId === 'ota_sponsored');
    expect(highPaying?.normalizedTotalCostVND).toBe(2_050_000);
    expect(highPaying?.breakdown.baggageFeeVND).toBe(250_000);
  });

  it('passes commercial ranking assertion when promoting the genuine cheapest channel', () => {
    const result = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [directAirlineQuote, discountOtaQuote],
    });

    expect(() =>
      assertCommercialRankingIntegrity('trip_discount', result)
    ).not.toThrow();
  });

  it('throws CommercialRankingOverrideError if a high-commission partner is falsely promoted over cheaper channel', () => {
    const result = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [directAirlineQuote, highPayingOtaQuote, discountOtaQuote],
    });

    // Attempting to assert ota_sponsored (1.8M) as top-promoted cheapest when trip_discount is 1.55M
    expect(() =>
      assertCommercialRankingIntegrity('ota_sponsored', result)
    ).toThrow(CommercialRankingOverrideError);
  });

  it('avoids double taxation when quoteBasis is TOTAL_INCLUSIVE_NO_BAGGAGE or ALL_INCLUSIVE_WITH_BAGGAGE (AUD-10)', () => {
    const inclusiveOtaQuote: ProviderQuoteInput = {
      providerId: 'ota_inclusive',
      providerName: 'Inclusive OTA',
      channelType: 'OTA_PARTNER',
      quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
      rawQuotedPriceVND: 1_600_000,
      mandatoryTaxesAndFeesVND: 400_000, // Disclosed component, already included in 1.6M
      checkedBaggageFeeVND: 200_000,
      isBaggageIncludedInQuote: false,
      deepLinkClass: 'DEEP_LINK_EXACT_OFFER',
      deepLinkUrl: 'https://example.com/inclusive',
      isCommercialPartner: false,
      observedAt: '2026-10-15T02:00:00Z',
    };

    const allInclusiveQuote: ProviderQuoteInput = {
      providerId: 'vna_package',
      providerName: 'Vietnam Airlines Package',
      channelType: 'DIRECT_AIRLINE',
      quoteBasis: 'ALL_INCLUSIVE_WITH_BAGGAGE',
      rawQuotedPriceVND: 1_900_000,
      mandatoryTaxesAndFeesVND: 400_000,
      checkedBaggageFeeVND: 250_000,
      isBaggageIncludedInQuote: true,
      deepLinkClass: 'DEEP_LINK_EXACT_OFFER',
      deepLinkUrl: 'https://vietnamairlines.com/package',
      isCommercialPartner: false,
      observedAt: '2026-10-15T02:00:00Z',
    };

    // Without baggage:
    const resNoBaggage = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [inclusiveOtaQuote, allInclusiveQuote],
      requiresCheckedBaggage: false,
    });

    const otaNoBaggage = resNoBaggage.channels.find((c) => c.providerId === 'ota_inclusive')!;
    // Should NOT be 1.6M + 400k = 2.0M! It must strictly remain 1.6M
    expect(otaNoBaggage.normalizedTotalCostVND).toBe(1_600_000);
    expect(otaNoBaggage.breakdown.mandatoryTaxesAndFeesVND).toBe(400_000);
    expect(otaNoBaggage.breakdown.baseFareVND).toBe(1_200_000);

    const allIncNoBaggage = resNoBaggage.channels.find((c) => c.providerId === 'vna_package')!;
    expect(allIncNoBaggage.normalizedTotalCostVND).toBe(1_900_000);

    // With baggage:
    const resWithBaggage = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [inclusiveOtaQuote, allInclusiveQuote],
      requiresCheckedBaggage: true,
    });

    const otaWithBaggage = resWithBaggage.channels.find((c) => c.providerId === 'ota_inclusive')!;
    // 1.6M raw + 200k baggage = 1.8M (not 1.8M + 400k taxes!)
    expect(otaWithBaggage.normalizedTotalCostVND).toBe(1_800_000);

    const allIncWithBaggage = resWithBaggage.channels.find((c) => c.providerId === 'vna_package')!;
    // Baggage is already included, so total cost remains 1.9M
    expect(allIncWithBaggage.normalizedTotalCostVND).toBe(1_900_000);
  });

  it('rejects non-finite, negative, or invalid tax price quotes (L02/L05/L07)', () => {
    const invalidQuote: ProviderQuoteInput = {
      ...directAirlineQuote,
      providerId: 'invalid_price',
      rawQuotedPriceVND: NaN,
    };

    expect(() =>
      compareProviderChannels({
        flightKey: 'VN214_SGN_HAN_20261101',
        quotes: [invalidQuote],
      })
    ).toThrow(/positive finite number/);

    const negativeTaxesQuote: ProviderQuoteInput = {
      ...directAirlineQuote,
      providerId: 'neg_taxes',
      mandatoryTaxesAndFeesVND: -50_000,
    };

    expect(() =>
      compareProviderChannels({
        flightKey: 'VN214_SGN_HAN_20261101',
        quotes: [negativeTaxesQuote],
      })
    ).toThrow(/non-negative finite number/);

    const taxesExceedingTotal: ProviderQuoteInput = {
      ...directAirlineQuote,
      providerId: 'bad_inclusive',
      quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
      rawQuotedPriceVND: 500_000,
      mandatoryTaxesAndFeesVND: 600_000, // Impossible: taxes > total quoted
    };

    expect(() =>
      compareProviderChannels({
        flightKey: 'VN214_SGN_HAN_20261101',
        quotes: [taxesExceedingTotal],
      })
    ).toThrow(/cannot be lower than mandatory taxes/);
  });

  it('prioritizes DIRECT_AIRLINE on exact price ties and enforces deterministic order (L01/L04)', () => {
    // Direct airline and OTA both offer identical total price 1.5M
    const tiedDirect: ProviderQuoteInput = {
      ...directAirlineQuote,
      providerId: 'vna_direct_tied',
      providerName: 'Vietnam Airlines',
      channelType: 'DIRECT_AIRLINE',
      quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
      rawQuotedPriceVND: 1_500_000,
      mandatoryTaxesAndFeesVND: 400_000,
      isBaggageIncludedInQuote: true,
    };

    const tiedOta: ProviderQuoteInput = {
      ...discountOtaQuote,
      providerId: 'ota_tied',
      providerName: 'OTA Aggregator Partner',
      channelType: 'OTA_PARTNER',
      quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
      rawQuotedPriceVND: 1_500_000,
      mandatoryTaxesAndFeesVND: 400_000,
      isBaggageIncludedInQuote: true,
    };

    const tiedAffiliate: ProviderQuoteInput = {
      providerId: 'affiliate_tied',
      providerName: 'Affiliate Referral Partner',
      channelType: 'AFFILIATE_AGGREGATOR',
      quoteBasis: 'TOTAL_INCLUSIVE_NO_BAGGAGE',
      rawQuotedPriceVND: 1_500_000,
      mandatoryTaxesAndFeesVND: 400_000,
      checkedBaggageFeeVND: 0,
      isBaggageIncludedInQuote: true,
      deepLinkClass: 'PROVIDER_HOMEPAGE_GENERIC',
      deepLinkUrl: 'https://example.com/affiliate',
      isCommercialPartner: true,
      observedAt: '2026-10-15T02:00:00Z',
    };

    // Pass in reverse order: Affiliate first, OTA second, Direct last
    const res = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [tiedAffiliate, tiedOta, tiedDirect],
      requiresCheckedBaggage: false,
    });

    // DIRECT_AIRLINE must be ranked first deterministically
    expect(res.channels[0].channelType).toBe('DIRECT_AIRLINE');
    expect(res.channels[0].providerId).toBe('vna_direct_tied');

    // OTA_PARTNER must be second
    expect(res.channels[1].channelType).toBe('OTA_PARTNER');
    expect(res.channels[1].providerId).toBe('ota_tied');

    // AFFILIATE_AGGREGATOR must be third
    expect(res.channels[2].channelType).toBe('AFFILIATE_AGGREGATOR');
    expect(res.channels[2].providerId).toBe('affiliate_tied');
  });

  it('validates deep link URLs and rejects unsafe schemes (L02/L11)', () => {
    expect(isValidDeepLinkUrl('https://vietnamairlines.com/book')).toBe(true);
    expect(isValidDeepLinkUrl('http://vietnamairlines.com/book')).toBe(true);
    expect(isValidDeepLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isValidDeepLinkUrl('data:text/html,<script>')).toBe(false);
    expect(isValidDeepLinkUrl('')).toBe(false);
    expect(isValidDeepLinkUrl(null)).toBe(false);

    const maliciousQuote: ProviderQuoteInput = {
      ...directAirlineQuote,
      providerId: 'malicious_xss',
      deepLinkUrl: 'javascript:document.cookie',
    };

    expect(() =>
      compareProviderChannels({
        flightKey: 'VN214_SGN_HAN_20261101',
        quotes: [maliciousQuote],
      })
    ).toThrow(/Invalid or unsafe deepLinkUrl/);
  });

  it('rejects invalid commission rates outside 0-100 range (L01/L02)', () => {
    const badCommissionQuote: ProviderQuoteInput = {
      ...highPayingOtaQuote,
      providerId: 'bad_commission',
      affiliateCommissionRatePercent: 120.0,
    };

    expect(() =>
      compareProviderChannels({
        flightKey: 'VN214_SGN_HAN_20261101',
        quotes: [badCommissionQuote],
      })
    ).toThrow(/between 0 and 100/);

    const negativeCommissionQuote: ProviderQuoteInput = {
      ...highPayingOtaQuote,
      providerId: 'neg_commission',
      affiliateCommissionRatePercent: -5.0,
    };

    expect(() =>
      compareProviderChannels({
        flightKey: 'VN214_SGN_HAN_20261101',
        quotes: [negativeCommissionQuote],
      })
    ).toThrow(/between 0 and 100/);
  });

  it('throws CommercialRankingOverrideError when intermediary displaces direct airline on identical price (F43)', () => {
    const tiedDirect: ProviderQuoteInput = {
      ...directAirlineQuote,
      providerId: 'vna_tied',
      providerName: 'Vietnam Airlines Direct',
      channelType: 'DIRECT_AIRLINE',
      rawQuotedPriceVND: 1_500_000,
      mandatoryTaxesAndFeesVND: 0,
      checkedBaggageFeeVND: 0,
      isBaggageIncludedInQuote: true,
    };

    const tiedOtaSponsored: ProviderQuoteInput = {
      ...highPayingOtaQuote,
      providerId: 'ota_sponsored_tied',
      providerName: 'SuperOTA Sponsored',
      channelType: 'OTA_PARTNER',
      rawQuotedPriceVND: 1_500_000,
      mandatoryTaxesAndFeesVND: 0,
      checkedBaggageFeeVND: 0,
      isBaggageIncludedInQuote: true,
      isCommercialPartner: true,
    };

    const result = compareProviderChannels({
      flightKey: 'VN214_SGN_HAN_20261101',
      quotes: [tiedDirect, tiedOtaSponsored],
    });

    // Promoting direct airline passes
    expect(() => assertCommercialRankingIntegrity('vna_tied', result)).not.toThrow();

    // Promoting OTA partner over identical-cost direct airline throws override error
    expect(() => assertCommercialRankingIntegrity('ota_sponsored_tied', result)).toThrow(
      CommercialRankingOverrideError
    );
  });
});
