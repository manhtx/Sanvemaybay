import { describe, expect, it } from 'vitest';
import {
  resolveDealsForPwaClient,
  assertOfflineFreshnessIntegrity,
  evictExpiredOfflineDeals,
  MAX_OFFLINE_CACHE_AGE_MINUTES,
  StaleOfflineDealAsFreshError,
  CachedDealRecord,
} from './pwaOfflineFreshness';

describe('F48: Mobile-First PWA and Push Freshness Integrity', () => {
  const sampleCachedDeal: CachedDealRecord = {
    id: 'deal_pwa_01',
    route: 'HAN-DAD',
    airlineCode: 'VN',
    priceVND: 950_000,
    observedAt: '2026-10-15T02:00:00Z',
    cachedAt: '2026-10-15T02:05:00Z',
  };

  it('marks offline cached deals with offline badge and disables unverified direct booking', () => {
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

  it('allows verified live presentation when online with fresh observations', () => {
    const results = resolveDealsForPwaClient({
      cachedDeals: [sampleCachedDeal],
      isDeviceOffline: false,
      nowIsoString: '2026-10-15T02:30:00Z', // 30 minutes after observation
    });

    expect(results[0].isOfflineCached).toBe(false);
    expect(results[0].isLiveVerified).toBe(true);
    expect(results[0].canDirectBook).toBe(true);
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
    const corruptedDeal = {
      ...sampleCachedDeal,
      isOfflineCached: true,
      offlineStalenessMinutes: 60,
      isLiveVerified: true, // INVALID in offline mode!
      canDirectBook: false,
      offlineBadgeLabelVi: 'Offline',
      disclosureNoticeVi: 'Notice',
    };

    expect(() =>
      assertOfflineFreshnessIntegrity(corruptedDeal, true)
    ).toThrow(StaleOfflineDealAsFreshError);
  });

  it('throws StaleOfflineDealAsFreshError if offline deal permits direct booking', () => {
    const corruptedDeal = {
      ...sampleCachedDeal,
      isOfflineCached: true,
      offlineStalenessMinutes: 60,
      isLiveVerified: false,
      canDirectBook: true, // INVALID in offline mode!
      offlineBadgeLabelVi: 'Offline',
      disclosureNoticeVi: 'Notice',
    };

    expect(() =>
      assertOfflineFreshnessIntegrity(corruptedDeal, true)
    ).toThrow(StaleOfflineDealAsFreshError);
  });

  describe('SOL-06: 14-Day Offline Cache Eviction & Temporal Safety', () => {
    const baseNow = '2026-10-26T12:00:00.000Z';

    it('evicts deals older than 14 days (20160 minutes)', () => {
      const deals: CachedDealRecord[] = [
        {
          id: 'fresh_deal',
          route: 'HAN-SGN',
          airlineCode: 'VJ',
          priceVND: 1200000,
          observedAt: '2026-10-26T10:00:00.000Z', // 2 hours old
          cachedAt: '2026-10-26T10:05:00.000Z',
        },
        {
          id: 'expired_15d_deal',
          route: 'HAN-DAD',
          airlineCode: 'VN',
          priceVND: 900000,
          observedAt: '2026-10-11T10:00:00.000Z', // 15.08 days old (> 14 days)
          cachedAt: '2026-10-11T10:05:00.000Z',
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
  });
});
