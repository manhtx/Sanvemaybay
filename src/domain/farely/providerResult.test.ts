import { describe, expect, it } from 'vitest';
import {
  createSuccessResult,
  createErrorResult,
  isResultHealthy,
  ProviderResultStatus
} from './providerResult';

describe('Farely Pure Domain Kernel — Provider Result & Contracts (REQ-PROV-001..005, NC-011, NC-012, NC-026)', () => {
  interface MockOffer {
    id: string;
    price: number;
  }

  describe('createSuccessResult', () => {
    it('sets status to SUCCESS_NONEMPTY when data array is non-empty', () => {
      const offers: MockOffer[] = [{ id: 'off_1', price: 1500000 }];
      const result = createSuccessResult('amadeus', offers);

      expect(result.status).toBe('SUCCESS_NONEMPTY');
      expect(result.provider).toBe('amadeus');
      expect(result.data).toEqual(offers);
      expect(result.isDegraded).toBe(false);
      expect(result.error).toBeUndefined();
      expect(new Date(result.observedAt).getTime()).toBeGreaterThan(0);
    });

    it('sets status to VERIFIED_EMPTY when data array is empty', () => {
      const result = createSuccessResult('google_flights', []);

      expect(result.status).toBe('VERIFIED_EMPTY');
      expect(result.provider).toBe('google_flights');
      expect(result.data).toEqual([]);
      expect(result.isDegraded).toBe(false);
    });
  });

  describe('createErrorResult', () => {
    it('NC-011: creates error result with empty data, explicit failure status, and isDegraded: true', () => {
      const result = createErrorResult<MockOffer>(
        'vietjet',
        'NETWORK_ERROR',
        'Connection reset by peer'
      );

      expect(result.status).toBe('NETWORK_ERROR');
      expect(result.provider).toBe('vietjet');
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Connection reset by peer');
      expect(result.isDegraded).toBe(true);
      expect(new Date(result.observedAt).getTime()).toBeGreaterThan(0);
    });

    it('NC-026: preserves HTTP 503 status code and telemetry metadata', () => {
      const metadata = {
        routesAttempted: 10,
        routesSucceeded: 2,
        httpStatusCode: 503,
        hasCaptcha: false,
        rawPayloadSize: 1024
      };

      const result = createErrorResult(
        'amadeus',
        'UPSTREAM_ERROR',
        'Service Unavailable',
        metadata
      );

      expect(result.status).toBe('UPSTREAM_ERROR');
      expect(result.metadata).toEqual(metadata);
      expect(result.metadata?.httpStatusCode).toBe(503);
      expect(result.isDegraded).toBe(true);
    });

    it('NC-012: preserves BOT_CHALLENGE status and captcha flags', () => {
      const result = createErrorResult('skyscanner', 'BOT_CHALLENGE', 'Cloudflare turnstile challenge', {
        hasCaptcha: true,
        httpStatusCode: 403
      });

      expect(result.status).toBe('BOT_CHALLENGE');
      expect(result.metadata?.hasCaptcha).toBe(true);
      expect(result.isDegraded).toBe(true);
    });

    it('throws when attempting to create error result with success status codes', () => {
      expect(() =>
        createErrorResult('amadeus', 'SUCCESS_NONEMPTY', 'invalid attempt')
      ).toThrowError('Cannot create error result with success status: SUCCESS_NONEMPTY');

      expect(() =>
        createErrorResult('amadeus', 'VERIFIED_EMPTY', 'invalid attempt')
      ).toThrowError('Cannot create error result with success status: VERIFIED_EMPTY');
    });

    it('creates RATE_LIMITED status with HTTP 429 metadata', () => {
      const result = createErrorResult('vietnam_airlines', 'RATE_LIMITED', 'Too Many Requests', {
        httpStatusCode: 429,
        routesAttempted: 1,
        routesSucceeded: 0,
      });

      expect(result.status).toBe('RATE_LIMITED');
      expect(result.metadata?.httpStatusCode).toBe(429);
      expect(result.isDegraded).toBe(true);
      expect(isResultHealthy(result)).toBe(false);
    });

    it('creates PARSER_SCHEMA_DRIFT status with payload size tracking', () => {
      const result = createErrorResult('bamboo', 'PARSER_SCHEMA_DRIFT', 'Unexpected JSON schema missing fare table', {
        rawPayloadSize: 8192,
      });

      expect(result.status).toBe('PARSER_SCHEMA_DRIFT');
      expect(result.metadata?.rawPayloadSize).toBe(8192);
      expect(result.isDegraded).toBe(true);
      expect(isResultHealthy(result)).toBe(false);
    });

    it('creates AUTH_ERROR status with HTTP 401 code', () => {
      const result = createErrorResult('amadeus', 'AUTH_ERROR', 'API key expired or invalid token', {
        httpStatusCode: 401,
      });

      expect(result.status).toBe('AUTH_ERROR');
      expect(result.metadata?.httpStatusCode).toBe(401);
      expect(result.isDegraded).toBe(true);
      expect(isResultHealthy(result)).toBe(false);
    });
  });

  describe('isResultHealthy gate', () => {
    it('returns true for SUCCESS_NONEMPTY and VERIFIED_EMPTY results', () => {
      const successPopulated = createSuccessResult('amadeus', [{ id: '1', price: 100 }]);
      const successEmpty = createSuccessResult('amadeus', []);

      expect(isResultHealthy(successPopulated)).toBe(true);
      expect(isResultHealthy(successEmpty)).toBe(true);
    });

    it('returns false for all 11 failure and degraded status codes', () => {
      const errorStatuses: ProviderResultStatus[] = [
        'PARTIAL_RESULTS',
        'DEGRADED_COVERAGE',
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMITED',
        'BOT_CHALLENGE',
        'PARSER_SCHEMA_DRIFT',
        'AUTH_ERROR',
        'UPSTREAM_ERROR',
        'UNSUPPORTED',
        'UNKNOWN_ERROR'
      ];

      for (const status of errorStatuses) {
        const result = createErrorResult('mock_provider', status, `Simulated ${status}`);
        expect(isResultHealthy(result)).toBe(false);
      }
    });

    it('NC-026 falsifier: HTTP 503 upstream error strictly fails the health gate', () => {
      const result503 = createErrorResult('vietnam_airlines', 'UPSTREAM_ERROR', 'HTTP 503', {
        httpStatusCode: 503
      });
      expect(isResultHealthy(result503)).toBe(false);
    });

    it('generates valid and recent ISO timestamp on observedAt', () => {
      const before = Date.now();
      const res = createSuccessResult('amadeus', [{ id: '1', price: 100 }]);
      const after = Date.now();

      const timestampMs = new Date(res.observedAt).getTime();
      expect(timestampMs).toBeGreaterThanOrEqual(before);
      expect(timestampMs).toBeLessThanOrEqual(after + 100);
      expect(res.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('preserves pure immutability on Object.freeze protected offer array input', () => {
      const frozenOffers = Object.freeze([
        Object.freeze({ id: 'freeze_1', price: 2_000_000 })
      ]);

      expect(() => createSuccessResult('vietjet', frozenOffers as any)).not.toThrow();
      expect(frozenOffers[0].price).toBe(2_000_000);
    });

    it('safely retains detailed diagnostic metadata across custom fields', () => {
      const detailedMeta = {
        routesAttempted: 5,
        routesSucceeded: 5,
        rawPayloadSize: 2048,
        httpStatusCode: 200,
        hasCaptcha: false
      };

      const errResult = createErrorResult('amadeus', 'TIMEOUT', 'Request timed out after 10000ms', detailedMeta);
      expect(errResult.metadata).toEqual(detailedMeta);
      expect(errResult.metadata?.routesAttempted).toBe(5);
      expect(errResult.metadata?.rawPayloadSize).toBe(2048);
    });

    it('distinguishes PARTIAL_RESULTS and DEGRADED_COVERAGE as degraded', () => {
      const partial = createErrorResult('amadeus', 'PARTIAL_RESULTS', '2 of 5 routes timed out');
      const degraded = createErrorResult('amadeus', 'DEGRADED_COVERAGE', 'Coverage below 50%');

      expect(partial.isDegraded).toBe(true);
      expect(degraded.isDegraded).toBe(true);
      expect(isResultHealthy(partial)).toBe(false);
      expect(isResultHealthy(degraded)).toBe(false);
    });

    it('distinguishes UNSUPPORTED and UNKNOWN_ERROR as degraded', () => {
      const unsupported = createErrorResult('amadeus', 'UNSUPPORTED', 'Route not supported');
      const unknown = createErrorResult('amadeus', 'UNKNOWN_ERROR', 'Unexpected exception');

      expect(unsupported.isDegraded).toBe(true);
      expect(unknown.isDegraded).toBe(true);
      expect(isResultHealthy(unsupported)).toBe(false);
      expect(isResultHealthy(unknown)).toBe(false);
    });

    it('isResultHealthy safely handles null, undefined, empty object, and malformed envelopes without throwing', () => {
      expect(isResultHealthy(null)).toBe(false);
      expect(isResultHealthy(undefined)).toBe(false);
      expect(isResultHealthy({} as any)).toBe(false);
      expect(isResultHealthy({ status: 'INVALID_STATUS' } as any)).toBe(false);
      expect(isResultHealthy('healthy' as any)).toBe(false);
      expect(isResultHealthy(12345 as any)).toBe(false);
    });

    it('createSuccessResult safely attaches and preserves telemetry metadata when provided', () => {
      const meta = {
        routesAttempted: 10,
        routesSucceeded: 10,
        rawPayloadSize: 4096,
        httpStatusCode: 200,
        hasCaptcha: false
      };
      const result = createSuccessResult('vietjet', [{ id: 'vj_1', price: 900000 }], meta);

      expect(result.status).toBe('SUCCESS_NONEMPTY');
      expect(result.isDegraded).toBe(false);
      expect(result.metadata).toEqual(meta);
      expect(result.metadata?.routesAttempted).toBe(10);
      expect(result.metadata?.routesSucceeded).toBe(10);
      expect(isResultHealthy(result)).toBe(true);
    });

    it('performance benchmark: 10,000 provider result operations execute in < 50ms', () => {
      const offers = [{ id: '1', price: 100 }];
      const start = performance.now();
      for (let i = 0; i < 5000; i++) {
        const res = createSuccessResult('amadeus', offers);
        isResultHealthy(res);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
