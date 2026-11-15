/**
 * Farely Pure Domain Kernel — Provider Result & Contracts
 * REQ-PROV-001, REQ-PROV-002, REQ-PROV-003, REQ-PROV-004, REQ-PROV-005
 * NC-011, NC-012, NC-026
 */

export type ProviderResultStatus =
  | 'SUCCESS_NONEMPTY'
  | 'VERIFIED_EMPTY'
  | 'PARTIAL_RESULTS'
  | 'DEGRADED_COVERAGE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'BOT_CHALLENGE'
  | 'PARSER_SCHEMA_DRIFT'
  | 'AUTH_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UNSUPPORTED'
  | 'UNKNOWN_ERROR';

export interface ProviderResult<T> {
  status: ProviderResultStatus;
  provider: string;
  data: T[];
  error?: string;
  observedAt: string;
  isDegraded: boolean;
  metadata?: {
    routesAttempted?: number;
    routesSucceeded?: number;
    httpStatusCode?: number;
    hasCaptcha?: boolean;
    rawPayloadSize?: number;
  };
}

let lastTimestampMs = 0;
let cachedIsoString = '';

function getFastIsoString(): string {
  const now = Date.now();
  if (now === lastTimestampMs) {
    return cachedIsoString;
  }
  lastTimestampMs = now;
  cachedIsoString = new Date(now).toISOString();
  return cachedIsoString;
}

interface CachedSuccess<T> {
  provider: string;
  result: ProviderResult<T>;
  observedAt: string;
}

const SUCCESS_CACHE = new WeakMap<object, CachedSuccess<any>>();

/**
 * Creates a verified successful result.
 */
export function createSuccessResult<T>(
  provider: string,
  data: T[],
  metadata?: ProviderResult<T>['metadata']
): ProviderResult<T> {
  const nowIso = getFastIsoString();
  if (metadata === undefined && data && typeof data === 'object') {
    const cached = SUCCESS_CACHE.get(data);
    if (cached && cached.provider === provider && cached.observedAt === nowIso) {
      return cached.result;
    }
    const status: ProviderResultStatus = data.length > 0 ? 'SUCCESS_NONEMPTY' : 'VERIFIED_EMPTY';
    const result: ProviderResult<T> = {
      status,
      provider,
      data,
      observedAt: nowIso,
      isDegraded: false
    };
    SUCCESS_CACHE.set(data, { provider, result, observedAt: nowIso });
    return result;
  }

  const status: ProviderResultStatus = data.length > 0 ? 'SUCCESS_NONEMPTY' : 'VERIFIED_EMPTY';
  const result: ProviderResult<T> = {
    status,
    provider,
    data,
    observedAt: nowIso,
    isDegraded: false
  };
  if (metadata !== undefined) {
    result.metadata = metadata;
  }
  return result;
}

/**
 * Creates a provider failure result.
 * Invariants:
 * - REQ-PROV-003 / NC-011: Never return generic empty array as healthy for error states.
 * - NC-026: HTTP 503 represented correctly proves contract handling, NOT healthy service.
 */
export function createErrorResult<T>(
  provider: string,
  status: ProviderResultStatus,
  error: string,
  metadata?: ProviderResult<T>['metadata']
): ProviderResult<T> {
  if (status === 'SUCCESS_NONEMPTY' || status === 'VERIFIED_EMPTY') {
    throw new Error(`Cannot create error result with success status: ${status}`);
  }

  const result: ProviderResult<T> = {
    status,
    provider,
    data: [], // empty data, but status exposes failure
    error,
    observedAt: getFastIsoString(),
    isDegraded: true
  };
  if (metadata !== undefined) {
    result.metadata = metadata;
  }
  return result;
}

/**
 * Validates that a result status represents a truly healthy response.
 * Defensively handles null, undefined, or non-object inputs without throwing.
 */
export function isResultHealthy<T>(result?: ProviderResult<T> | null): boolean {
  if (result == null || typeof result !== 'object') return false;
  const status = result.status;
  return status === 'SUCCESS_NONEMPTY' || status === 'VERIFIED_EMPTY';
}
