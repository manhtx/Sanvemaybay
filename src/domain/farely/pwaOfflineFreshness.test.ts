import { describe, expect, it } from 'vitest';
import {
  resolveDealsForPwaClient,
  assertOfflineFreshnessIntegrity,
  StaleOfflineDealAsFreshError,
  CachedDealRecord,
  evictExpiredOfflineDeals,
  enqueueOfflineAction,
  MAX_OFFLINE_CACHE_AGE_MINUTES,
  MAX_OFFLINE_ACTION_QUEUE_SIZE,
  LIVE_REVALIDATION_THRESHOLD_MINUTES,
  OfflineActionQueueItem,
} from './pwaOfflineFreshness';

describe('F48: Mobile-First PWA and Push Freshness Integrity', () => {
  const sampleCachedDeal: CachedDealRecord = {
    id: 'deal_vj_han_sgn_123',
    route: 'HAN-SGN',
    airlineCode: 'VJ',
    priceVND: 1_200_000,
    observedAt: '2026-10-15T02:00:00Z',
    cachedAt: '2026-10-15T02:05:00Z',
  };

  const baseNow = '2026-10-26T12:00:00.000Z';

  it('marks all deals as cached and prevents direct booking when device is offline', () => {
    const results = resolveDealsForPwaClient({
      cachedDeals: [sampleCachedDeal],
      isDeviceOffline: true,
      nowIsoString: '2026-10-15T03:00:00Z',
    });

    expect(results).toHaveLength(1);
    const item = results[0];
    expect(item.isOfflineCached).toBe(true);
    expect(item.isLiveVerified).toBe(false);
    expect(item.canDirectBook).toBe(false);
    expect(item.offlineBadgeLabelVi).toContain('Offline');
    expect(item.disclosureNoticeVi).toContain('mất kết nối mạng');
  });

  it('allows verified live presentation when online with fresh observations (<= 45m)', () => {
    const results = resolveDealsForPwaClient({
      cachedDeals: [sampleCachedDeal],
      isDeviceOffline: false,
      nowIsoString: '2026-10-15T02:30:00Z', // 30 minutes after observation
    });

    expect(results[0].isOfflineCached).toBe(false);
    expect(results[0].isLiveVerified).toBe(true);
    expect(results[0].canDirectBook).toBe(true);
    expect(results[0].offlineBadgeLabelVi).toContain('xác minh');
  });

  it('demotes deals older than 45 minutes to pending revalidation in online mode (L01)', () => {
    const results = resolveDealsForPwaClient({
      cachedDeals: [sampleCachedDeal],
      isDeviceOffline: false,
      nowIsoString: '2026-10-15T02:50:00Z', // 50 minutes after observation (> 45 min)
    });

    expect(results[0].isLiveVerified).toBe(false);
    expect(results[0].canDirectBook).toBe(false);
    expect(results[0].offlineBadgeLabelVi).toContain('chờ cập nhật');
  });

  it('passes assertion check for properly formatted offline deals', () => {
    const results = resolveDealsForPwaClient({
      cachedDeals: [sampleCachedDeal],
      isDeviceOffline: true,
      nowIsoString: '2026-10-15T03:00:00Z',
    });

    expect(() =>
      assertOfflineFreshnessIntegrity(results[0], true)
    ).not.toThrow();
  });

  it('throws StaleOfflineDealAsFreshError if offline deal has isLiveVerified=true', () => {
    const invalidOfflineDeal = {
      id: 'deal_invalid',
      route: 'SGN-DAD',
      airlineCode: 'VN',
      priceVND: 950_000,
      observedAt: '2026-10-15T01:00:00Z',
      isOfflineCached: true,
      offlineStalenessMinutes: 60,
      isLiveVerified: true, // INVALID in offline mode!
      canDirectBook: false,
      offlineBadgeLabelVi: 'Offline',
      disclosureNoticeVi: 'Notice',
    };

    expect(() =>
      assertOfflineFreshnessIntegrity(invalidOfflineDeal, true)
    ).toThrow(StaleOfflineDealAsFreshError);
  });

  it('throws StaleOfflineDealAsFreshError if offline deal permits direct booking', () => {
    const invalidBookingDeal = {
      id: 'deal_invalid_book',
      route: 'SGN-PQC',
      airlineCode: 'QH',
      priceVND: 800_000,
      observedAt: '2026-10-15T01:00:00Z',
      isOfflineCached: true,
      offlineStalenessMinutes: 60,
      isLiveVerified: false,
      canDirectBook: true, // INVALID in offline mode!
      offlineBadgeLabelVi: 'Offline',
      disclosureNoticeVi: 'Notice',
    };

    expect(() =>
      assertOfflineFreshnessIntegrity(invalidBookingDeal, true)
    ).toThrow(StaleOfflineDealAsFreshError);
  });

  it('throws StaleOfflineDealAsFreshError if offline deal is missing isOfflineCached flag', () => {
    const missingCacheFlagDeal = {
      id: 'deal_missing_flag',
      route: 'HAN-CXR',
      airlineCode: 'VJ',
      priceVND: 1_100_000,
      observedAt: '2026-10-15T01:00:00Z',
      isOfflineCached: false, // INVALID in offline mode!
      offlineStalenessMinutes: 60,
      isLiveVerified: false,
      canDirectBook: false,
      offlineBadgeLabelVi: 'Offline',
      disclosureNoticeVi: 'Notice',
    };

    expect(() =>
      assertOfflineFreshnessIntegrity(missingCacheFlagDeal, true)
    ).toThrow(StaleOfflineDealAsFreshError);
  });

  it('throws StaleOfflineDealAsFreshError if online deal has stale observation but isLiveVerified=true (L01/L10)', () => {
    const falselyLiveDeal = {
      id: 'deal_stale_live',
      route: 'HAN-SGN',
      airlineCode: 'VJ',
      priceVND: 1_200_000,
      observedAt: '2026-10-15T01:00:00Z',
      isOfflineCached: false,
      offlineStalenessMinutes: 50, // > 45 minutes
      isLiveVerified: true, // INVALID when stale!
      canDirectBook: true,
      offlineBadgeLabelVi: 'Live',
      disclosureNoticeVi: 'Notice',
    };

    expect(() =>
      assertOfflineFreshnessIntegrity(falselyLiveDeal, false)
    ).toThrow(StaleOfflineDealAsFreshError);
  });

  describe('Adversarial & Offline Edge Case Defense (AUD-14 / L04 / L06)', () => {
    it('evicts deals exceeding maximum retention period (14 days)', () => {
      const deals: CachedDealRecord[] = [
        {
          id: 'fresh_deal',
          route: 'HAN-SGN',
          airlineCode: 'VN',
          priceVND: 1500000,
          observedAt: '2026-10-25T12:00:00.000Z', // 1 day ago
          cachedAt: '2026-10-25T12:00:00.000Z',
        },
        {
          id: 'ancient_deal',
          route: 'HAN-DAD',
          airlineCode: 'VJ',
          priceVND: 900000,
          observedAt: '2026-10-01T12:00:00.000Z', // 25 days ago (> 14 days)
          cachedAt: '2026-10-01T12:00:00.000Z',
        },
      ];

      const evicted = evictExpiredOfflineDeals(deals, MAX_OFFLINE_CACHE_AGE_MINUTES, baseNow);
      expect(evicted).toHaveLength(1);
      expect(evicted[0].id).toBe('fresh_deal');
    });

    it('evicts deals with corrupt timestamps or impossible future dates', () => {
      const anomalyDeals: CachedDealRecord[] = [
        {
          id: 'corrupt_timestamp',
          route: 'SGN-PQC',
          airlineCode: 'QH',
          priceVND: 800000,
          observedAt: 'not-a-valid-date',
          cachedAt: 'invalid-cache-date',
        },
        {
          id: 'future_tampered_deal',
          route: 'SGN-CXR',
          airlineCode: 'VU',
          priceVND: 750000,
          observedAt: '2026-11-01T12:00:00.000Z', // In the future (>5 min drift)
          cachedAt: '2026-11-01T12:00:00.000Z',
        },
      ];

      const result = evictExpiredOfflineDeals(anomalyDeals, MAX_OFFLINE_CACHE_AGE_MINUTES, baseNow);
      expect(result).toHaveLength(0);
    });

    it('automatically discards expired deals during resolveDealsForPwaClient', () => {
      const mixedDeals: CachedDealRecord[] = [
        {
          id: 'active_cached',
          route: 'HAN-SGN',
          airlineCode: 'VJ',
          priceVND: 1500000,
          observedAt: '2026-10-25T12:00:00.000Z', // 24 hours old
          cachedAt: '2026-10-25T12:00:00.000Z',
        },
        {
          id: 'stale_20d',
          route: 'HAN-PQC',
          airlineCode: 'VN',
          priceVND: 2100000,
          observedAt: '2026-10-01T12:00:00.000Z', // 25 days old
          cachedAt: '2026-10-01T12:00:00.000Z',
        },
      ];

      const resolved = resolveDealsForPwaClient({
        cachedDeals: mixedDeals,
        isDeviceOffline: true,
        nowIsoString: baseNow,
      });

      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe('active_cached');
    });

    it('sanitizes non-positive prices and prevents direct booking on invalid price data', () => {
      const corruptPriceDeal: CachedDealRecord = {
        id: 'corrupt_price_deal',
        route: 'HAN-DAD',
        airlineCode: 'VN',
        priceVND: -500000,
        observedAt: '2026-10-26T11:58:00.000Z', // 2 minutes ago
        cachedAt: '2026-10-26T11:58:00.000Z',
      };

      const resolvedOffline = resolveDealsForPwaClient({
        cachedDeals: [corruptPriceDeal],
        isDeviceOffline: true,
        nowIsoString: baseNow,
      });

      expect(resolvedOffline[0].priceVND).toBe(0);
      expect(resolvedOffline[0].canDirectBook).toBe(false);
      expect(resolvedOffline[0].offlineBadgeLabelVi).toContain('không hợp lệ');

      const resolvedOnline = resolveDealsForPwaClient({
        cachedDeals: [corruptPriceDeal],
        isDeviceOffline: false,
        nowIsoString: baseNow,
      });

      expect(resolvedOnline[0].priceVND).toBe(0);
      expect(resolvedOnline[0].canDirectBook).toBe(false);
      expect(resolvedOnline[0].isLiveVerified).toBe(false);
      expect(resolvedOnline[0].offlineBadgeLabelVi).toBe('Dữ liệu giá không hợp lệ');
    });

    it('idempotently deduplicates identical actions and preserves bounded FIFO queue capacity', () => {
      let queue: OfflineActionQueueItem[] = [];

      // Enqueue bookmark for deal 1
      queue = enqueueOfflineAction(queue, {
        id: 'act_1',
        actionType: 'TOGGLE_BOOKMARK',
        payload: { dealId: 'deal_100' },
        queuedAt: '2026-10-27T08:00:00.000Z',
        status: 'PENDING_SYNC',
      });
      expect(queue).toHaveLength(1);

      // Repeat bookmark action for same deal -> should deduplicate
      queue = enqueueOfflineAction(queue, {
        id: 'act_2',
        actionType: 'TOGGLE_BOOKMARK',
        payload: { dealId: 'deal_100' },
        queuedAt: '2026-10-27T08:01:00.000Z',
        status: 'PENDING_SYNC',
      });
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('act_2');

      // Watch action deduplicates by watchId (L02)
      queue = enqueueOfflineAction(queue, {
        id: 'act_watch_1',
        actionType: 'PAUSE_WATCH',
        payload: { watchId: 'watch_abc' },
        queuedAt: '2026-10-27T08:02:00.000Z',
        status: 'PENDING_SYNC',
      });
      expect(queue).toHaveLength(2);

      queue = enqueueOfflineAction(queue, {
        id: 'act_watch_2',
        actionType: 'PAUSE_WATCH',
        payload: { watchId: 'watch_abc' },
        queuedAt: '2026-10-27T08:03:00.000Z',
        status: 'PENDING_SYNC',
      });
      expect(queue).toHaveLength(2);
      expect(queue[1].id).toBe('act_watch_2');

      // Different deal -> appends
      queue = enqueueOfflineAction(queue, {
        id: 'act_3',
        actionType: 'TOGGLE_BOOKMARK',
        payload: { dealId: 'deal_200' },
        queuedAt: 'invalid-date', // corrupt timestamp fallback
        status: 'PENDING_SYNC',
      });
      expect(queue).toHaveLength(3);
      expect(queue[2].queuedAt).not.toBe('invalid-date');

      // Handles null/invalid action safely (L02/L05)
      queue = enqueueOfflineAction(queue, null as any);
      expect(queue).toHaveLength(3);

      // Saturate queue past MAX_OFFLINE_ACTION_QUEUE_SIZE
      for (let i = 0; i < 120; i++) {
        queue = enqueueOfflineAction(queue, {
          id: `burst_act_${i}`,
          actionType: 'PAUSE_WATCH',
          payload: { dealId: `deal_${i}` },
          queuedAt: new Date().toISOString(),
          status: 'PENDING_SYNC',
        });
      }
      expect(queue.length).toBe(MAX_OFFLINE_ACTION_QUEUE_SIZE);
      expect(queue.length).toBeLessThanOrEqual(100);
    });
  });
});
