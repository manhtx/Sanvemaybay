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

/**
 * Creates a verified successful result.
 */
export function createSuccessResult<T>(provider: string, data: T[]): ProviderResult<T> {
  const status: ProviderResultStatus = data.length > 0 ? 'SUCCESS_NONEMPTY' : 'VERIFIED_EMPTY';
  return {
    status,
    provider,
    data,
    observedAt: new Date().toISOString(),
    isDegraded: false
  };
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

  return {
    status,
    provider,
    data: [], // empty data, but status exposes failure
    error,
    observedAt: new Date().toISOString(),
    isDegraded: true,
    metadata
  };
}

/**
 * Validates that a result status represents a truly healthy response.
 */
export function isResultHealthy<T>(result: ProviderResult<T>): boolean {
  return result.status === 'SUCCESS_NONEMPTY' || result.status === 'VERIFIED_EMPTY';
}
