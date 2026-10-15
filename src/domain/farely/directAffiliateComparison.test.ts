import { describe, expect, it } from 'vitest';
import {
  compareProviderChannels,
  assertCommercialRankingIntegrity,
  CommercialRankingOverrideError,
  ProviderQuoteInput,
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
});
