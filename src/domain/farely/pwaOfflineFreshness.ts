/**
 * F48: Mobile-First PWA and Push Freshness Integrity (Tier P2)
 *
 * Requirements:
 * - Solution: Offline-safe experience, permission/consent, cache certainty protection and Watch-driven notification value.
 * - Acceptance Invariant: Offline observed fares cannot appear as freshly available deals.
 */

export class StaleOfflineDealAsFreshError extends Error {
  constructor(message: string) {
    super(`[F48_OFFLINE_DEAL_AS_FRESH_VIOLATION] ${message}`);
    this.name = 'StaleOfflineDealAsFreshError';
  }
}

export interface CachedDealRecord {
  id: string;
  route: string;
  airlineCode: string;
  priceVND: number;
  observedAt: string; // ISO 8601
  cachedAt: string;   // ISO 8601 when written to IndexedDB/ServiceWorker
}

export interface ResolvedOfflineDeal {
  id: string;
  route: string;
  airlineCode: string;
  priceVND: number;
  observedAt: string;
  isOfflineCached: boolean;
  offlineStalenessMinutes: number;
  isLiveVerified: boolean;
  canDirectBook: boolean;
  offlineBadgeLabelVi: string;
  disclosureNoticeVi: string;
}

export interface OfflineActionQueueItem {
  id: string;
  actionType: 'TOGGLE_BOOKMARK' | 'PAUSE_WATCH' | 'RESUME_WATCH';
  payload: Record<string, unknown>;
  queuedAt: string;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
}

/**
 * Resolves deals served from PWA offline cache.
 * Enforces strict invariant: Offline observed fares CANNOT appear as freshly available deals (F48).
 */
export function resolveDealsForPwaClient(params: {
  cachedDeals: CachedDealRecord[];
  isDeviceOffline: boolean;
  nowIsoString?: string;
}): ResolvedOfflineDeal[] {
  const { cachedDeals, isDeviceOffline, nowIsoString = new Date().toISOString() } = params;
  const nowMs = new Date(nowIsoString).getTime();

  return cachedDeals.map((deal) => {
    const _cachedMs = new Date(deal.cachedAt).getTime();
    const observedMs = new Date(deal.observedAt).getTime();
    const stalenessMinutes = Math.max(0, Math.round((nowMs - observedMs) / (1000 * 60)));

    if (isDeviceOffline) {
      // Invariant: In offline mode, the deal can NEVER be live verified or directly bookable
      return {
        id: deal.id,
        route: deal.route,
        airlineCode: deal.airlineCode,
        priceVND: deal.priceVND,
        observedAt: deal.observedAt,
        isOfflineCached: true,
        offlineStalenessMinutes: stalenessMinutes,
        isLiveVerified: false,
        canDirectBook: false,
        offlineBadgeLabelVi: 'Dữ liệu lưu tạm ngoại tuyến (Offline)',
        disclosureNoticeVi:
          'Bạn đang xem dữ liệu lưu tạm khi mất kết nối mạng. Giá vé và tình trạng chỗ có thể đã thay đổi. Vui lòng kết nối Internet để xác minh lại trước khi đặt vé.',
      };
    }

    // In online mode, cached records can be used for initial render if within 30 min,
    // but still clearly indicate cache status until background revalidation completes.
    const isLive = stalenessMinutes <= 120; // 2 hours
    return {
      id: deal.id,
      route: deal.route,
      airlineCode: deal.airlineCode,
      priceVND: deal.priceVND,
      observedAt: deal.observedAt,
      isOfflineCached: false,
      offlineStalenessMinutes: stalenessMinutes,
      isLiveVerified: isLive,
      canDirectBook: isLive,
      offlineBadgeLabelVi: isLive ? 'Giá trực tuyến đã xác minh' : 'Dữ liệu chờ cập nhật',
      disclosureNoticeVi: isLive
        ? 'Dữ liệu trực tuyến đã được đối sánh gần nhất.'
        : 'Quan sát đã cũ, hệ thống đang làm mới dữ liệu từ nhà cung cấp.',
    };
  });
}

/**
 * Validates that an offline deal presentation does not violate F48.
 * Throws StaleOfflineDealAsFreshError if offline data was marked as live or fresh.
 */
export function assertOfflineFreshnessIntegrity(deal: ResolvedOfflineDeal, isDeviceOffline: boolean): void {
  if (isDeviceOffline) {
    if (deal.isLiveVerified) {
      throw new StaleOfflineDealAsFreshError(
        `Deal ${deal.id} (${deal.route}) is served in offline mode but marked with isLiveVerified=true.`
      );
    }
    if (deal.canDirectBook) {
      throw new StaleOfflineDealAsFreshError(
        `Deal ${deal.id} (${deal.route}) permits direct booking action while device is offline without re-verification.`
      );
    }
    if (!deal.isOfflineCached) {
      throw new StaleOfflineDealAsFreshError(
        `Deal ${deal.id} (${deal.route}) missing mandatory isOfflineCached indicator in offline presentation.`
      );
    }
  }
}
