import { describe, expect, it } from 'vitest';
import {
  evaluateLiveVerifyHealth,
  evaluateObservedOpportunityHealth,
  evaluateRouteCoverageHealth,
  evaluateRouteFreshness,
  RouteExecutionRecord,
} from './productionHealth';

describe('Production Health & Execution-backed Coverage (Sections 16, 18, 30, 31, 34, 54, NC-011, NC-026)', () => {
  describe('evaluateRouteFreshness (Section 30)', () => {
    const baseNow = '2026-10-05T12:00:00.000Z';

    it('returns NEVER_ATTEMPTED with null age when last_success_at is null', () => {
      const record: RouteExecutionRecord = {
        route_id: 'r-never',
        origin_code: 'HAN',
        destination_code: 'CDG',
        last_attempt_at: '2026-10-05T10:00:00.000Z',
        last_success_at: null,
        attempt_count: 2,
        success_count: 0,
        failure_count: 2,
        last_failure_reason: 'NETWORK_ERROR',
      };

      const result = evaluateRouteFreshness(record, baseNow);
      expect(result.status).toBe('NEVER_ATTEMPTED');
      expect(result.age_minutes).toBeNull();
      expect(result.route_id).toBe('r-never');
    });

    it('returns FRESH when elapsed time is <= 240 minutes (4 hours)', () => {
      const record: RouteExecutionRecord = {
        route_id: 'r-fresh',
        origin_code: 'HAN',
        destination_code: 'BKK',
        last_attempt_at: '2026-10-05T11:00:00.000Z',
        last_success_at: '2026-10-05T11:00:00.000Z', // 60 min ago
        attempt_count: 5,
        success_count: 5,
        failure_count: 0,
        last_failure_reason: null,
      };

      const result = evaluateRouteFreshness(record, baseNow);
      expect(result.status).toBe('FRESH');
      expect(result.age_minutes).toBe(60);
    });

    it('returns DEGRADED when elapsed time is between 241 and 720 minutes (4h - 12h)', () => {
      const record: RouteExecutionRecord = {
        route_id: 'r-degraded',
        origin_code: 'SGN',
        destination_code: 'NRT',
        last_attempt_at: '2026-10-05T06:00:00.000Z',
        last_success_at: '2026-10-05T06:00:00.000Z', // 360 min (6h) ago
        attempt_count: 4,
        success_count: 4,
        failure_count: 0,
        last_failure_reason: null,
      };

      const result = evaluateRouteFreshness(record, baseNow);
      expect(result.status).toBe('DEGRADED');
      expect(result.age_minutes).toBe(360);
    });

    it('returns STALE when elapsed time exceeds 720 minutes (> 12 hours)', () => {
      const record: RouteExecutionRecord = {
        route_id: 'r-stale',
        origin_code: 'DAD',
        destination_code: 'SIN',
        last_attempt_at: '2026-10-04T12:00:00.000Z',
        last_success_at: '2026-10-04T12:00:00.000Z', // 1440 min (24h) ago
        attempt_count: 6,
        success_count: 1,
        failure_count: 5,
        last_failure_reason: 'PROVIDER_ERROR',
      };

      const result = evaluateRouteFreshness(record, baseNow);
      expect(result.status).toBe('STALE');
      expect(result.age_minutes).toBe(1440);
    });
  });

  describe('evaluateRouteCoverageHealth (Sections 31, 34, 54)', () => {
    it('returns RED when configuredCount <= 0 or routes array is empty', () => {
      const empty = evaluateRouteCoverageHealth(0, []);
      expect(empty.status).toBe('RED');
      expect(empty.evidence.failure_rate).toBe(1);

      const noRoutes = evaluateRouteCoverageHealth(10, []);
      expect(noRoutes.status).toBe('RED');
    });

    it('Section 54 Negative Control: Failure rate >= 30% forces status RED', () => {
      const routes: RouteExecutionRecord[] = [
        { route_id: 'r1', origin_code: 'HAN', destination_code: 'BKK', last_attempt_at: '2026-10-05T10:00:00Z', last_success_at: '2026-10-05T10:00:00Z', attempt_count: 3, success_count: 3, failure_count: 0, last_failure_reason: null },
        { route_id: 'r2', origin_code: 'SGN', destination_code: 'SIN', last_attempt_at: '2026-10-05T10:00:00Z', last_success_at: '2026-10-05T10:00:00Z', attempt_count: 3, success_count: 3, failure_count: 0, last_failure_reason: null },
        { route_id: 'r3', origin_code: 'DAD', destination_code: 'ICN', last_attempt_at: '2026-10-05T10:00:00Z', last_success_at: null, attempt_count: 3, success_count: 0, failure_count: 3, last_failure_reason: 'PROVIDER_ERROR' },
        { route_id: 'r4', origin_code: 'HAN', destination_code: 'NRT', last_attempt_at: '2026-10-05T10:00:00Z', last_success_at: null, attempt_count: 3, success_count: 0, failure_count: 3, last_failure_reason: 'NETWORK_ERROR' },
      ];

      const result = evaluateRouteCoverageHealth(10, routes);
      expect(result.status).toBe('RED');
      expect(result.evidence.failure_rate).toBe(0.5); // 2 out of 4 attempted failed
      expect(result.summary).toContain('50% lỗi');
    });

    it('returns AMBER when failure rate is between 10% and 30%', () => {
      const routes: RouteExecutionRecord[] = Array.from({ length: 10 }, (_, i) => ({
        route_id: `r-${i}`,
        origin_code: 'HAN',
        destination_code: `DEST-${i}`,
        last_attempt_at: '2026-10-05T10:00:00Z',
        last_success_at: i === 9 ? null : '2026-10-05T10:00:00Z',
        attempt_count: 2,
        success_count: i === 9 ? 0 : 2,
        failure_count: i === 9 ? 2 : 0,
        last_failure_reason: i === 9 ? 'PARSER_ERROR' : null,
      }));

      const result = evaluateRouteCoverageHealth(10, routes);
      expect(result.status).toBe('AMBER');
      expect(result.evidence.failure_rate).toBe(0.1);
      const breakdown = result.evidence.failure_breakdown as Record<string, number>;
      expect(breakdown.PARSER_ERROR).toBe(1);
    });

    it('returns GREEN when all attempted routes succeed and execution coverage >= 80%', () => {
      const routes: RouteExecutionRecord[] = Array.from({ length: 10 }, (_, i) => ({
        route_id: `r-${i}`,
        origin_code: 'HAN',
        destination_code: `DEST-${i}`,
        last_attempt_at: '2026-10-05T10:00:00Z',
        last_success_at: '2026-10-05T10:00:00Z',
        attempt_count: 5,
        success_count: 5,
        failure_count: 0,
        last_failure_reason: null,
      }));

      const result = evaluateRouteCoverageHealth(10, routes);
      expect(result.status).toBe('GREEN');
      expect(result.evidence.failure_rate).toBe(0);
      expect(result.evidence.execution_coverage_rate).toBe(1.0);
    });
  });

  describe('evaluateLiveVerifyHealth (Section 34, NC-026)', () => {
    it('returns AMBER when recentChecksCount is 0', () => {
      const health = evaluateLiveVerifyHealth({
        recentChecksCount: 0,
        provider503Count: 0,
        successCount: 0,
        averageLatencyMs: 0,
      });

      expect(health.status).toBe('AMBER');
      expect(health.summary).toContain('Đang chờ lượt xác minh');
    });

    it('Section 34 & NC-026: Live provider HTTP 503 degrades capability to AMBER or RED', () => {
      const healthAmber = evaluateLiveVerifyHealth({
        recentChecksCount: 10,
        provider503Count: 2,
        successCount: 8,
        averageLatencyMs: 1200,
      });

      expect(healthAmber.status).toBe('AMBER');
      expect(healthAmber.summary).toContain('HTTP 503: 2');

      const healthRed = evaluateLiveVerifyHealth({
        recentChecksCount: 10,
        provider503Count: 6,
        successCount: 4,
        averageLatencyMs: 2500,
      });

      expect(healthRed.status).toBe('RED');
      expect(healthRed.summary).toContain('HTTP 503: 6');
    });

    it('returns GREEN when verification is stable without 503s and error rate < 20%', () => {
      const health = evaluateLiveVerifyHealth({
        recentChecksCount: 50,
        provider503Count: 0,
        successCount: 48,
        averageLatencyMs: 450,
      });

      expect(health.status).toBe('GREEN');
      expect(health.summary).toContain('hoạt động ổn định');
    });
  });

  describe('evaluateObservedOpportunityHealth (Section 34)', () => {
    it('Section 34: healthy_empty (0 deals) reports AMBER, not masking as an active green feed', () => {
      const health = evaluateObservedOpportunityHealth({
        opportunityCount: 0,
        oldestAgeMinutes: 10,
        feedStatus: 'healthy_empty',
      });

      expect(health.status).toBe('AMBER');
      expect(health.summary).toContain('kho dữ liệu trống');
    });

    it('reports AMBER when feedStatus is degraded_freshness or oldest age > 720 minutes', () => {
      const degraded = evaluateObservedOpportunityHealth({
        opportunityCount: 25,
        oldestAgeMinutes: 800, // > 12h
        feedStatus: 'active',
      });

      expect(degraded.status).toBe('AMBER');
      expect(degraded.summary).toContain('quá 12 giờ');

      const degradedStatus = evaluateObservedOpportunityHealth({
        opportunityCount: 15,
        oldestAgeMinutes: 120,
        feedStatus: 'degraded_freshness',
      });

      expect(degradedStatus.status).toBe('AMBER');
    });

    it('reports GREEN when opportunityCount > 0 and feed is fresh', () => {
      const healthy = evaluateObservedOpportunityHealth({
        opportunityCount: 45,
        oldestAgeMinutes: 180,
        feedStatus: 'active',
      });

      expect(healthy.status).toBe('GREEN');
      expect(healthy.summary).toContain('45 cơ hội giá vé');
    });
  });

  describe('High-Volume Performance & Pure Immutability', () => {
    it('evaluates 500 route execution records in sub-50ms', () => {
      const routes: RouteExecutionRecord[] = Array.from({ length: 500 }, (_, i) => ({
        route_id: `route-${i}`,
        origin_code: 'HAN',
        destination_code: `DEST-${i % 50}`,
        last_attempt_at: '2026-10-05T10:00:00Z',
        last_success_at: i % 10 === 0 ? null : '2026-10-05T10:00:00Z',
        attempt_count: 5,
        success_count: i % 10 === 0 ? 0 : 5,
        failure_count: i % 10 === 0 ? 5 : 0,
        last_failure_reason: i % 10 === 0 ? 'PROVIDER_ERROR' : null,
      }));

      const start = performance.now();
      const coverage = evaluateRouteCoverageHealth(500, routes);
      const elapsed = performance.now() - start;

      expect(coverage.evidence.attempted).toBe(500);
      expect(coverage.evidence.successful).toBe(450);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate input route execution records or frozen parameters', () => {
      const frozenRecord = Object.freeze({
        route_id: 'r-frozen',
        origin_code: 'HAN',
        destination_code: 'BKK',
        last_attempt_at: '2026-10-05T11:00:00.000Z',
        last_success_at: '2026-10-05T11:00:00.000Z',
        attempt_count: 3,
        success_count: 3,
        failure_count: 0,
        last_failure_reason: null,
      });

      const freshness = evaluateRouteFreshness(frozenRecord, '2026-10-05T12:00:00.000Z');
      expect(freshness.status).toBe('FRESH');
      expect(frozenRecord.route_id).toBe('r-frozen');
    });
  });
});
