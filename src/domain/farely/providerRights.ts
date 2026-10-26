/**
 * Farely Pure Domain Kernel — Provider Source Rights Registry
 * F85: Provider source rights registry
 * Acceptance: "No premium/B2B redistribution without actual rights."
 * NC-006, REQ-DOM-002, REQ-PROV-001
 * 
 * EPISTEMIC STATUS & LEGAL DISCLAIMER (AUD-08):
 * Entries in PROVIDER_SOURCE_RIGHTS_REGISTRY represent internal architectural specifications,
 * access-control guardrails, and compliance policy declarations implemented within Farely's software boundaries.
 * They DO NOT constitute or imply executed commercial agreements, GDS master services agreements,
 * or third-party legal licenses.
 * Live commercial API execution requires separate founder legal authorization and resolution of BLK-PROV-01.
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

export type ProviderDeclarationStatus =
  | 'INTERNAL_DECLARATION'
  | 'COMMERCIAL_STAGED_CONTRACT_REQUIRED';

export interface ProviderSourceRights {
  providerId: string;
  sourceName: string;
  licenseType: SourceLicenseType;
  declarationStatus: ProviderDeclarationStatus;
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
    declarationStatus: 'INTERNAL_DECLARATION',
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
    declarationStatus: 'INTERNAL_DECLARATION',
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
    declarationStatus: 'INTERNAL_DECLARATION',
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
    declarationStatus: 'INTERNAL_DECLARATION',
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
    declarationStatus: 'COMMERCIAL_STAGED_CONTRACT_REQUIRED',
    canScrape: false,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 3600,
    canRedistributeB2B: true, // Commercial GDS architectural stub; staged pending executed contract
    canMonetizeAffiliate: true,
    attributionRequired: false,
    termsSummary: 'Architectural stub for commercial GDS distribution. Staged pending executed commercial contract (BLK-PROV-01).',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS', 'B2B_SYNDICATION'],
  },
  sabre_enterprise_feed: {
    providerId: 'sabre_enterprise_feed',
    sourceName: 'Sabre Enterprise API',
    licenseType: 'COMMERCIAL_DIRECT',
    declarationStatus: 'COMMERCIAL_STAGED_CONTRACT_REQUIRED',
    canScrape: false,
    canDisplayDirectly: true,
    canCache: true,
    cacheTtlSeconds: 7200,
    canRedistributeB2B: true, // Commercial API architectural stub; staged pending executed contract
    canMonetizeAffiliate: true,
    attributionRequired: false,
    termsSummary: 'Architectural stub for Enterprise B2B licensing. Staged pending executed commercial contract (BLK-PROV-01).',
    authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS', 'B2B_SYNDICATION'],
  },
};

/**
 * Checks whether an integration requires an executed commercial contract before live activation.
 * AUD-08: Ensures architectural declarations are never misrepresented as executed legal rights.
 */
export function isCommercialContractRequired(providerId: string): boolean {
  const rights = getProviderSourceRights(providerId);
  return rights?.declarationStatus === 'COMMERCIAL_STAGED_CONTRACT_REQUIRED';
}

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
export function hasB2BRedistributionRights(
  providerId: string,
  options: { requireExecutedContract?: boolean } = {}
): boolean {
  const rights = getProviderSourceRights(providerId);
  if (!rights) return false;
  if (options.requireExecutedContract && rights.declarationStatus === 'COMMERCIAL_STAGED_CONTRACT_REQUIRED') {
    return false;
  }
  return rights.canRedistributeB2B && rights.authorizedScopes.includes('B2B_SYNDICATION');
}

/**
 * Validates a list of provider IDs against B2B redistribution rights.
 */
export function validateB2BRedistributionScope(
  providerIds: string[],
  options: { requireExecutedContract?: boolean } = {}
): {
  authorized: string[];
  denied: { providerId: string; reason: string }[];
} {
  const authorized: string[] = [];
  const denied: { providerId: string; reason: string }[] = [];
  const cleanedIds = Array.from(
    new Set((providerIds || []).map((id) => (id || '').trim().toLowerCase()).filter(Boolean))
  );

  for (const id of cleanedIds) {
    const rights = getProviderSourceRights(id);
    if (!rights) {
      denied.push({
        providerId: id,
        reason: `Nguồn dữ liệu '${id}' chưa được đăng ký trong Provider Rights Registry.`,
      });
    } else if (
      options.requireExecutedContract &&
      rights.declarationStatus === 'COMMERCIAL_STAGED_CONTRACT_REQUIRED'
    ) {
      denied.push({
        providerId: id,
        reason: `Nguồn '${rights.sourceName}' yêu cầu hợp đồng thương mại có hiệu lực trước khi phân phối B2B (COMMERCIAL_STAGED_CONTRACT_REQUIRED).`,
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
  options: { strict?: boolean; requireExecutedContract?: boolean } = {}
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
    if (hasB2BRedistributionRights(pId, options)) {
      permittedRecords.push(record);
    } else {
      rejectedRecords.push(record);
      const rights = getProviderSourceRights(pId);
      let reason: string;
      if (!rights) {
        reason = `Nguồn '${pId}' không xác định trong registry.`;
      } else if (
        options.requireExecutedContract &&
        rights.declarationStatus === 'COMMERCIAL_STAGED_CONTRACT_REQUIRED'
      ) {
        reason = `Nguồn '${rights.sourceName}' yêu cầu hợp đồng thương mại có hiệu lực trước khi phân phối B2B (COMMERCIAL_STAGED_CONTRACT_REQUIRED).`;
      } else {
        reason = `Nguồn '${rights.sourceName}' không có quyền B2B syndication.`;
      }
      rejectedReasons.push({ providerId: pId, reason });

      if (options.strict) {
        throw new DataRightsViolationError(pId, 'B2B_REDISTRIBUTION', reason);
      }
    }
  }

  return { permittedRecords, rejectedRecords, rejectedReasons };
}

/**
 * Safe retrieval of provider source rights.
 * If the provider is not registered, returns a safe RESTRICTED dummy declaration
 * preventing accidental scope leakage or runtime null pointer exceptions.
 */
export function getSafeProviderRights(providerId: string): ProviderSourceRights {
  const existing = PROVIDER_SOURCE_RIGHTS_REGISTRY[providerId];
  if (existing) return existing;
  return {
    providerId,
    sourceName: `Unknown Provider (${providerId})`,
    licenseType: 'RESTRICTED',
    declarationStatus: 'INTERNAL_DECLARATION',
    canScrape: false,
    canDisplayDirectly: false,
    canCache: false,
    cacheTtlSeconds: 0,
    canRedistributeB2B: false,
    canMonetizeAffiliate: false,
    attributionRequired: true,
    termsSummary: 'Unregistered source; strictly denied for external display or distribution.',
    authorizedScopes: [],
  };
}

/**
 * Validates whether a provider is permitted to execute queries for a given data scope.
 */
export function isProviderQueryPermitted(providerId: string, scope: AuthorizedDataScope): boolean {
  const rights = getSafeProviderRights(providerId);
  if (rights.licenseType === 'RESTRICTED') return false;
  return rights.authorizedScopes.includes(scope);
}

