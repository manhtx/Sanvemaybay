/**
 * Farely Pure Domain Kernel — Typed Provider Capability Matrix
 * F61: One-way/roundtrip support boundary
 * REQ-PROV-001, REQ-DOM-002, NC-006
 */

import type { JourneyType, CabinClass, MarketScope, TravelIntent } from './travelIntent.ts';

export interface ProviderCapabilities {
  providerId: string;
  displayName: string;
  supportedJourneyTypes: readonly JourneyType[];
  supportsMultiCity: boolean;
  supportsFlexibleDates: boolean;
  supportsDirectBooking: boolean;
  requiresExactDates: boolean;
  supportedCabinClasses: readonly CabinClass[];
  supportedMarketScopes: readonly MarketScope[];
  maxAdvanceDays?: number;
  rateLimitPerMinute?: number;
}

export const PROVIDER_CAPABILITY_REGISTRY: Record<string, ProviderCapabilities> = {
  vietjet_direct: {
    providerId: 'vietjet_direct',
    displayName: 'Vietjet Air Direct',
    supportedJourneyTypes: ['ONE_WAY', 'ROUND_TRIP'],
    supportsMultiCity: false,
    supportsFlexibleDates: true,
    supportsDirectBooking: true,
    requiresExactDates: false,
    supportedCabinClasses: ['ECONOMY'],
    supportedMarketScopes: ['DOMESTIC', 'INTERNATIONAL'],
    maxAdvanceDays: 365,
    rateLimitPerMinute: 60,
  },
  vietnam_airlines: {
    providerId: 'vietnam_airlines',
    displayName: 'Vietnam Airlines',
    supportedJourneyTypes: ['ONE_WAY', 'ROUND_TRIP'],
    supportsMultiCity: true,
    supportsFlexibleDates: true,
    supportsDirectBooking: true,
    requiresExactDates: false,
    supportedCabinClasses: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'],
    supportedMarketScopes: ['DOMESTIC', 'INTERNATIONAL'],
    maxAdvanceDays: 360,
    rateLimitPerMinute: 60,
  },
  bamboo_airways: {
    providerId: 'bamboo_airways',
    displayName: 'Bamboo Airways',
    supportedJourneyTypes: ['ONE_WAY', 'ROUND_TRIP'],
    supportsMultiCity: false,
    supportsFlexibleDates: false,
    supportsDirectBooking: true,
    requiresExactDates: true,
    supportedCabinClasses: ['ECONOMY', 'BUSINESS'],
    supportedMarketScopes: ['DOMESTIC'],
    maxAdvanceDays: 180,
    rateLimitPerMinute: 30,
  },
  fast_flights_google: {
    providerId: 'fast_flights_google',
    displayName: 'Google Flights Aggregator',
    supportedJourneyTypes: ['ONE_WAY', 'ROUND_TRIP'],
    supportsMultiCity: false,
    supportsFlexibleDates: true,
    supportsDirectBooking: false,
    requiresExactDates: true,
    supportedCabinClasses: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
    supportedMarketScopes: ['DOMESTIC', 'INTERNATIONAL'],
    maxAdvanceDays: 330,
    rateLimitPerMinute: 120,
  },
  vietjet_promo_roundtrip_only: {
    providerId: 'vietjet_promo_roundtrip_only',
    displayName: 'Vietjet Promo Package (Khứ hồi bắt buộc)',
    supportedJourneyTypes: ['ROUND_TRIP'],
    supportsMultiCity: false,
    supportsFlexibleDates: false,
    supportsDirectBooking: true,
    requiresExactDates: true,
    supportedCabinClasses: ['ECONOMY'],
    supportedMarketScopes: ['DOMESTIC', 'INTERNATIONAL'],
    maxAdvanceDays: 90,
    rateLimitPerMinute: 20,
  },
  charter_oneway_only: {
    providerId: 'charter_oneway_only',
    displayName: 'Charter Repositioning (Một chiều)',
    supportedJourneyTypes: ['ONE_WAY'],
    supportsMultiCity: false,
    supportsFlexibleDates: false,
    supportsDirectBooking: true,
    requiresExactDates: true,
    supportedCabinClasses: ['ECONOMY'],
    supportedMarketScopes: ['DOMESTIC', 'INTERNATIONAL'],
    maxAdvanceDays: 30,
    rateLimitPerMinute: 10,
  },
};

export function getProviderCapabilities(providerId: string): ProviderCapabilities | undefined {
  return PROVIDER_CAPABILITY_REGISTRY[providerId.trim().toLowerCase()];
}

export function isProviderSupportingJourneyType(providerId: string, journeyType: JourneyType): boolean {
  const caps = getProviderCapabilities(providerId);
  if (!caps) return false;
  return caps.supportedJourneyTypes.includes(journeyType);
}

export interface IntentProviderCompatibilityResult {
  compatible: boolean;
  providerId: string;
  violations: string[];
}

/**
 * Validates travel intent compatibility with a specific provider.
 * INVARIANT F61: A one-way request MUST NEVER silently become a round-trip request.
 */
export function validateIntentProviderCompatibility(
  providerId: string,
  intent: TravelIntent
): IntentProviderCompatibilityResult {
  const caps = getProviderCapabilities(providerId);
  const violations: string[] = [];

  if (!caps) {
    return {
      compatible: false,
      providerId,
      violations: [`Nhà cung cấp '${providerId}' không tồn tại trong danh mục hệ thống.`],
    };
  }

  // Strict F61 validation: Check journey type
  if (!caps.supportedJourneyTypes.includes(intent.journeyType)) {
    violations.push(
      `Nhà cung cấp '${caps.displayName}' không hỗ trợ hình thức hành trình '${intent.journeyType}'. ` +
      `Yêu cầu '${intent.journeyType}' không bao giờ được tự động chuyển đổi sang loại khác.`
    );
  }

  // Check market scope
  if (!caps.supportedMarketScopes.includes(intent.marketScope)) {
    violations.push(
      `Nhà cung cấp '${caps.displayName}' không hỗ trợ phạm vi thị trường '${intent.marketScope}'.`
    );
  }

  // Check cabin class
  if (!caps.supportedCabinClasses.includes(intent.cabin)) {
    violations.push(
      `Nhà cung cấp '${caps.displayName}' không hỗ trợ hạng vé '${intent.cabin}'.`
    );
  }

  return {
    compatible: violations.length === 0,
    providerId,
    violations,
  };
}

/**
 * Filters a list of provider IDs by compatibility with travel intent.
 * Providers that cannot fulfill the requested journeyType or marketScope are excluded,
 * NEVER coerced.
 */
export function filterProvidersByIntent(
  providerIds: readonly string[],
  intent: TravelIntent
): string[] {
  return providerIds.filter((pid) => {
    const result = validateIntentProviderCompatibility(pid, intent);
    return result.compatible;
  });
}

export interface ProviderSearchQuery {
  providerId: string;
  journeyType: JourneyType;
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate?: string;
  adults: number;
  cabin: CabinClass;
}

/**
 * Builds a typed provider search query strictly adhering to the F61 boundary.
 * Throws an explicit error if a provider cannot handle the requested journey type.
 */
export function createProviderSearchQuery(
  providerId: string,
  intent: TravelIntent
): ProviderSearchQuery {
  const validation = validateIntentProviderCompatibility(providerId, intent);
  if (!validation.compatible) {
    throw new Error(
      `F61 boundary violation: Cannot create provider query for '${providerId}': ${validation.violations.join('; ')}`
    );
  }

  const outboundDate = intent.outbound.exact || intent.outbound.from;
  if (!outboundDate) {
    throw new Error('Travel intent requires at least an exact or starting outbound date');
  }

  // Invariant F61: If journeyType is ONE_WAY, returnDate is strictly undefined
  let returnDate: string | undefined = undefined;
  if (intent.journeyType === 'ROUND_TRIP') {
    returnDate = intent.inbound?.exact || intent.inbound?.from;
    if (!returnDate) {
      throw new Error('Round-trip travel intent requires an inbound return date');
    }
  }

  return {
    providerId,
    journeyType: intent.journeyType,
    origin: intent.originScope.primaryCode,
    destination: intent.destinationScope.primaryCode,
    outboundDate,
    returnDate,
    adults: intent.passengers.adults,
    cabin: intent.cabin,
  };
}
