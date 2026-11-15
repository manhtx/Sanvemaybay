import { Deal } from "../data/deals";

export interface FeedCacheEntry {
  savedAt: number;
  deals: Deal[];
}

export interface ObservedFaresCacheEntry {
  savedAt: number;
  fares: Deal[];
  total: number;
  status: "healthy" | "healthy_empty" | "valid_zero" | "unmonitored" | "degraded_freshness" | "stale_only" | "provider_unavailable";
  latestObservedAt?: string;
  feedAgeMinutes?: number;
}

export const FEED_CACHE_TTL_MS = 15 * 60 * 1000;

let lastRawFeedCache: string | null = null;
let lastParsedFeedCache: FeedCacheEntry | null = null;

let lastRawObservedCache: string | null = null;
let lastParsedObservedCache: ObservedFaresCacheEntry | null = null;

export function readFeedCache(storage: Storage | undefined, now = Date.now()): FeedCacheEntry | undefined {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem("farely.feed-cache") ?? storage.getItem("flycheap.feed-cache");
    if (!raw) return undefined;
    if (raw === lastRawFeedCache && lastParsedFeedCache) {
      if (now - lastParsedFeedCache.savedAt > FEED_CACHE_TTL_MS) return undefined;
      return lastParsedFeedCache;
    }
    const parsed = JSON.parse(raw) as Partial<FeedCacheEntry> | null;
    if (!parsed || !Number.isFinite(parsed.savedAt) || !Array.isArray(parsed.deals) || now - Number(parsed.savedAt) > FEED_CACHE_TTL_MS) return undefined;
    const entry: FeedCacheEntry = { savedAt: Number(parsed.savedAt), deals: parsed.deals as Deal[] };
    lastRawFeedCache = raw;
    lastParsedFeedCache = entry;
    return entry;
  } catch {
    return undefined;
  }
}

export function writeFeedCache(storage: Storage | undefined, deals: Deal[], now = Date.now()): void {
  if (!storage) return;
  const payload: FeedCacheEntry = { savedAt: now, deals };
  const serialized = JSON.stringify(payload);
  lastRawFeedCache = serialized;
  lastParsedFeedCache = payload;
  storage.setItem("farely.feed-cache", serialized);
}

export function readObservedFaresCache(storage: Storage | undefined, now = Date.now(), allowStale = false): ObservedFaresCacheEntry | undefined {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem("farely.observed-cache") ?? storage.getItem("flycheap.observed-cache");
    if (!raw) return undefined;
    if (raw === lastRawObservedCache && lastParsedObservedCache) {
      if (!allowStale && now - lastParsedObservedCache.savedAt > FEED_CACHE_TTL_MS) return undefined;
      return lastParsedObservedCache;
    }
    const parsed = JSON.parse(raw) as Partial<ObservedFaresCacheEntry> | null;
    if (!parsed || !Number.isFinite(parsed.savedAt) || !Array.isArray(parsed.fares)) return undefined;
    if (!allowStale && now - Number(parsed.savedAt) > FEED_CACHE_TTL_MS) return undefined;
    const entry: ObservedFaresCacheEntry = {
      savedAt: Number(parsed.savedAt),
      fares: parsed.fares as Deal[],
      total: Number(parsed.total) || parsed.fares.length,
      status: parsed.status as ObservedFaresCacheEntry["status"] || "healthy",
      latestObservedAt: parsed.latestObservedAt,
      feedAgeMinutes: parsed.feedAgeMinutes,
    };
    lastRawObservedCache = raw;
    lastParsedObservedCache = entry;
    return entry;
  } catch {
    return undefined;
  }
}

export function writeObservedFaresCache(storage: Storage | undefined, entry: Omit<ObservedFaresCacheEntry, "savedAt">, now = Date.now()): void {
  if (!storage) return;
  const payload: ObservedFaresCacheEntry = { ...entry, savedAt: now };
  const serialized = JSON.stringify(payload);
  lastRawObservedCache = serialized;
  lastParsedObservedCache = payload;
  storage.setItem("farely.observed-cache", serialized);
}
