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
 * Maximum permitted queue capacity for offline user actions (F48).
 * Enforces bounded memory limits on mobile PWA clients.
 */
export const MAX_OFFLINE_ACTION_QUEUE_SIZE = 100;

/**
 * Enqueues an offline action into the PWA action queue.
 * - Idempotently deduplicates identical action types targeting the same entity (dealId).
 * - Enforces valid ISO timestamp or falls back to current time.
 * - Enforces bounded FIFO capacity: newest items preserved, oldest items trimmed.
 */
export function enqueueOfflineAction(
  queue: OfflineActionQueueItem[],
  newAction: OfflineActionQueueItem
): OfflineActionQueueItem[] {
  const deduplicated = queue.filter(
    (item) => !(item.actionType === newAction.actionType && item.payload?.dealId === newAction.payload?.dealId)
  );
  const validQueuedAt = !Number.isNaN(new Date(newAction.queuedAt).getTime())
    ? newAction.queuedAt
    : new Date().toISOString();
  const sanitizedAction: OfflineActionQueueItem = {
    ...newAction,
    queuedAt: validQueuedAt,
  };
  const nextQueue = [...deduplicated, sanitizedAction];
  return nextQueue.slice(-MAX_OFFLINE_ACTION_QUEUE_SIZE);
}

/**
 * Maximum permitted retention age for offline cached deals (14 days = 14 * 24 * 60 minutes).
 * Any observation older than 14 days is strictly evicted from local caches.
 */
export const MAX_OFFLINE_CACHE_AGE_MINUTES = 20160;

/**
 * Filters out expired or temporal-anomaly offline cached deals.
 * - Evicts deals exceeding maxAgeMinutes (default 14 days).
 * - Evicts deals with corrupt/unparseable timestamps.
 * - Evicts deals with impossible future timestamps (> 5 minutes clock drift).
 */
export function evictExpiredOfflineDeals(
  cachedDeals: CachedDealRecord[],
  maxAgeMinutes: number = MAX_OFFLINE_CACHE_AGE_MINUTES,
  nowIsoString: string = new Date().toISOString()
): CachedDealRecord[] {
  const nowMs = new Date(nowIsoString).getTime();

  return cachedDeals.filter((deal) => {
    const cachedTime = new Date(deal.cachedAt).getTime();
    const observedTime = new Date(deal.observedAt).getTime();

    if (Number.isNaN(cachedTime) || Number.isNaN(observedTime)) {
      return false; // Corrupt timestamp
    }

    const stalenessMinutes = (nowMs - observedTime) / (60 * 1000);

    // Reject impossible future observations (allowing up to 5 min clock skew)
    if (stalenessMinutes < -5) {
      return false;
    }

    // Reject observations older than maxAgeMinutes
    return stalenessMinutes <= maxAgeMinutes;
  });
}

/**
 * Resolves deals served from PWA offline cache.
 * Enforces strict invariant: Offline observed fares CANNOT appear as freshly available deals (F48).
 */
export function resolveDealsForPwaClient(params: {
  cachedDeals: CachedDealRecord[];
  isDeviceOffline: boolean;
  nowIsoString?: string;
  maxAgeMinutes?: number;
}): ResolvedOfflineDeal[] {
  const { cachedDeals, isDeviceOffline, nowIsoString = new Date().toISOString(), maxAgeMinutes = MAX_OFFLINE_CACHE_AGE_MINUTES } = params;
  const nowMs = new Date(nowIsoString).getTime();

  const validDeals = evictExpiredOfflineDeals(cachedDeals, maxAgeMinutes, nowIsoString);

  return validDeals.map((deal) => {
    const _cachedMs = new Date(deal.cachedAt).getTime();
    const observedMs = new Date(deal.observedAt).getTime();
    const safeObservedMs = Number.isFinite(observedMs) ? observedMs : nowMs;
    const stalenessMinutes = Math.max(0, Math.round((nowMs - safeObservedMs) / (1000 * 60)));
    const isPriceValid = typeof deal.priceVND === 'number' && Number.isFinite(deal.priceVND) && deal.priceVND > 0;

    if (isDeviceOffline) {
      // Invariant: In offline mode, the deal can NEVER be live verified or directly bookable
      return {
        id: deal.id,
        route: deal.route,
        airlineCode: deal.airlineCode,
        priceVND: isPriceValid ? deal.priceVND : 0,
        observedAt: deal.observedAt,
        isOfflineCached: true,
        offlineStalenessMinutes: stalenessMinutes,
        isLiveVerified: false,
        canDirectBook: false,
        offlineBadgeLabelVi: isPriceValid
          ? 'Dữ liệu lưu tạm ngoại tuyến (Offline)'
          : 'Dữ liệu giá ngoại tuyến không hợp lệ',
        disclosureNoticeVi: isPriceValid
          ? 'Bạn đang xem dữ liệu lưu tạm khi mất kết nối mạng. Giá vé và tình trạng chỗ có thể đã thay đổi. Vui lòng kết nối Internet để xác minh lại trước khi đặt vé.'
          : 'Giá vé lưu tạm không hợp lệ hoặc bị lỗi dữ liệu. Vui lòng kết nối Internet để làm mới dữ liệu.',
      };
    }

    // In online mode, cached records can be used for initial render if within 30 min,
    // but still clearly indicate cache status until background revalidation completes.
    const isLive = isPriceValid && stalenessMinutes <= 120; // 2 hours
    return {
      id: deal.id,
      route: deal.route,
      airlineCode: deal.airlineCode,
      priceVND: isPriceValid ? deal.priceVND : 0,
      observedAt: deal.observedAt,
      isOfflineCached: false,
      offlineStalenessMinutes: stalenessMinutes,
      isLiveVerified: isLive,
      canDirectBook: isLive,
      offlineBadgeLabelVi: !isPriceValid
        ? 'Dữ liệu giá không hợp lệ'
        : isLive
        ? 'Giá trực tuyến đã xác minh'
        : 'Dữ liệu chờ cập nhật',
      disclosureNoticeVi: !isPriceValid
        ? 'Giá vé quan sát không hợp lệ hoặc đã bị lỗi dữ liệu, không thể chuyển tiếp đặt vé.'
        : isLive
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
