/**
 * Farely Pure Domain Kernel — Provider Source Rights Registry
 * F85: Provider source rights registry
 * Acceptance: "No premium/B2B redistribution without actual rights."
 * NC-006, REQ-DOM-002, REQ-PROV-001
 */

export type SourceLicenseType =
  | 'PUBLIC_INDICATIVE'
  | 'COMMERCIAL_DIRECT'
  | 'AFFILIATE_PARTNER'
  | 'RESTRICTED';

export type AuthorizedDataScope =
  | 'CONSUMER_INDICATIVE'
  | 'INTERNAL_ANALYTICS'
  | 'B2B_SYNDICATION';

export interface ProviderSourceRights {
  providerId: string;
  sourceName: string;
  licenseType: SourceLicenseType;
  // Specific data rights
  canScrape: boolean;
  canDisplayDirectly: boolean;
  canCache: boolean;
  cacheTtlSeconds: number;
  canRedistributeB2B: boolean;
  canMonetizeAffiliate: boolean;
  attributionRequired: boolean;
  termsSummary: string;
  authorizedScopes: readonly AuthorizedDataScope[];
}

export const PROVIDER_SOURCE_RIGHTS_REGISTRY: Record<string, ProviderSourceRights> = {
  vietjet_direct: {
    providerId: 'vietjet_direct',
    sourceName: 'Vietjet Air Direct',
    licenseType: 'PUBLIC_INDICATIVE',
    canScrape: true,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 1800,
    canRedistributeB2B: false, // Strict: Public web scraping cannot be syndicated B2B without enterprise license
    canMonetizeAffiliate: true,
    attributionRequired: true,
    termsSummary: 'Public web fare display with consumer redirection. No third-party API redistribution permitted.',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS'],
  },
  vietnam_airlines: {
    providerId: 'vietnam_airlines',
    sourceName: 'Vietnam Airlines',
    licenseType: 'PUBLIC_INDICATIVE',
    canScrape: true,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 1800,
    canRedistributeB2B: false,
    canMonetizeAffiliate: true,
    attributionRequired: true,
    termsSummary: 'Indicative consumer pricing with booking handoff. Commercial B2B syndication prohibited without direct GDS contract.',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS'],
  },
  bamboo_airways: {
    providerId: 'bamboo_airways',
    sourceName: 'Bamboo Airways',
    licenseType: 'PUBLIC_INDICATIVE',
    canScrape: true,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 1800,
    canRedistributeB2B: false,
    canMonetizeAffiliate: true,
    attributionRequired: true,
    termsSummary: 'Indicative schedule and fare display.',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS'],
  },
  fast_flights_google: {
    providerId: 'fast_flights_google',
    sourceName: 'Google Flights Aggregator',
    licenseType: 'PUBLIC_INDICATIVE',
    canScrape: true,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 900,
    canRedistributeB2B: false, // Aggregator terms strictly forbid raw commercial syndication
    canMonetizeAffiliate: false,
    attributionRequired: true,
    termsSummary: 'Aggregated indicative fares. Commercial resale or B2B redistribution strictly prohibited.',
    authorizedScopes: ['CONSUMER_INDICATIVE'],
  },
  amadeus_commercial_gds: {
    providerId: 'amadeus_commercial_gds',
    sourceName: 'Amadeus Commercial GDS',
    licenseType: 'COMMERCIAL_DIRECT',
    canScrape: false,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 3600,
    canRedistributeB2B: true, // Commercial GDS with negotiated B2B resale license
    canMonetizeAffiliate: true,
    attributionRequired: false,
    termsSummary: 'Full commercial GDS distribution agreement permitting B2B API syndication and white-label integration.',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS', 'B2B_SYNDICATION'],
  },
  sabre_enterprise_feed: {
    providerId: 'sabre_enterprise_feed',
    sourceName: 'Sabre Enterprise API',
    licenseType: 'COMMERCIAL_DIRECT',
    canScrape: false,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 7200,
    canRedistributeB2B: true,
    canMonetizeAffiliate: true,
    attributionRequired: false,
    termsSummary: 'Enterprise B2B data licensing agreement.',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS', 'B2B_SYNDICATION'],
  },
};

export class DataRightsViolationError extends Error {
  providerId: string;
  action: string;

  constructor(providerId: string, action: string, message: string) {
    super(`[F85 DataRightsViolation] Nhà cung cấp '${providerId}' vi phạm quyền khai thác dữ liệu: ${message}`);
    this.name = 'DataRightsViolationError';
    this.providerId = providerId;
    this.action = action;
  }
}

export function getProviderSourceRights(providerId: string): ProviderSourceRights | undefined {
  return PROVIDER_SOURCE_RIGHTS_REGISTRY[providerId.trim().toLowerCase()];
}

/**
 * Checks whether a specific provider has rights for B2B redistribution.
 * INVARIANT F85: No premium/B2B redistribution without actual rights.
 */
export function hasB2BRedistributionRights(providerId: string): boolean {
  const rights = getProviderSourceRights(providerId);
  if (!rights) return false;
  return rights.canRedistributeB2B && rights.authorizedScopes.includes('B2B_SYNDICATION');
}

/**
 * Validates a list of provider IDs against B2B redistribution rights.
 */
export function validateB2BRedistributionScope(providerIds: string[]): {
  authorized: string[];
  denied: { providerId: string; reason: string }[];
} {
  const authorized: string[] = [];
  const denied: { providerId: string; reason: string }[] = [];

  for (const id of providerIds) {
    const rights = getProviderSourceRights(id);
    if (!rights) {
      denied.push({
        providerId: id,
        reason: `Nguồn dữ liệu '${id}' chưa được đăng ký trong Provider Rights Registry.`,
      });
    } else if (!rights.canRedistributeB2B || !rights.authorizedScopes.includes('B2B_SYNDICATION')) {
      denied.push({
        providerId: id,
        reason: `Nguồn '${rights.sourceName}' thuộc phân loại '${rights.licenseType}' — Không có quyền B2B syndication/redistribution (${rights.termsSummary}).`,
      });
    } else {
      authorized.push(id);
    }
  }

  return { authorized, denied };
}

/**
 * Enforces B2B data syndication rights by filtering or throwing.
 * INVARIANT F85: If strict is true and unauthorized provider exists, throws DataRightsViolationError.
 * Otherwise, cleanly filters out unauthorized records from export payloads.
 */
export function filterRecordsForB2BExport<T extends { providerId?: string }>(
  records: T[],
  options: { strict?: boolean } = {}
): {
  permittedRecords: T[];
  rejectedRecords: T[];
  rejectedReasons: { providerId: string; reason: string }[];
} {
  const permittedRecords: T[] = [];
  const rejectedRecords: T[] = [];
  const rejectedReasons: { providerId: string; reason: string }[] = [];

  for (const record of records) {
    const pId = record.providerId || 'unknown';
    if (hasB2BRedistributionRights(pId)) {
      permittedRecords.push(record);
    } else {
      rejectedRecords.push(record);
      const rights = getProviderSourceRights(pId);
      const reason = rights
        ? `Nguồn '${rights.sourceName}' không có quyền B2B syndication.`
        : `Nguồn '${pId}' không xác định trong registry.`;
      rejectedReasons.push({ providerId: pId, reason });

      if (options.strict) {
        throw new DataRightsViolationError(pId, 'B2B_REDISTRIBUTION', reason);
      }
    }
  }

  return { permittedRecords, rejectedRecords, rejectedReasons };
}
