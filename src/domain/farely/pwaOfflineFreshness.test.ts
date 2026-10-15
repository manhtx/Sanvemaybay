import { describe, expect, it } from 'vitest';
import {
  resolveDealsForPwaClient,
  assertOfflineFreshnessIntegrity,
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
});
