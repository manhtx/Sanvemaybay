import { Deal } from "../data/deals";

export interface FeedCacheEntry {
  savedAt: number;
  deals: Deal[];
}

export interface ObservedFaresCacheEntry {
  savedAt: number;
  fares: Deal[];
  total: number;
  status: "healthy" | "healthy_empty" | "degraded_freshness" | "stale_only" | "provider_unavailable";
  latestObservedAt?: string;
  feedAgeMinutes?: number;
}

export const FEED_CACHE_TTL_MS = 15 * 60 * 1000;

export function readFeedCache(storage: Storage | undefined, now = Date.now()): FeedCacheEntry | undefined {
  if (!storage) return undefined;
  try {
    const parsed = JSON.parse(storage.getItem("farely.feed-cache") ?? storage.getItem("flycheap.feed-cache") ?? "null") as Partial<FeedCacheEntry> | null;
    if (!parsed || !Number.isFinite(parsed.savedAt) || !Array.isArray(parsed.deals) || now - Number(parsed.savedAt) > FEED_CACHE_TTL_MS) return undefined;
    return { savedAt: Number(parsed.savedAt), deals: parsed.deals as Deal[] };
  } catch {
    return undefined;
  }
}

export function writeFeedCache(storage: Storage | undefined, deals: Deal[], now = Date.now()): void {
  storage?.setItem("farely.feed-cache", JSON.stringify({ savedAt: now, deals } satisfies FeedCacheEntry));
}

export function readObservedFaresCache(storage: Storage | undefined, now = Date.now(), allowStale = false): ObservedFaresCacheEntry | undefined {
  if (!storage) return undefined;
  try {
    const parsed = JSON.parse(storage.getItem("farely.observed-cache") ?? storage.getItem("flycheap.observed-cache") ?? "null") as Partial<ObservedFaresCacheEntry> | null;
    if (!parsed || !Number.isFinite(parsed.savedAt) || !Array.isArray(parsed.fares)) return undefined;
    if (!allowStale && now - Number(parsed.savedAt) > FEED_CACHE_TTL_MS) return undefined;
    return {
      savedAt: Number(parsed.savedAt),
      fares: parsed.fares as Deal[],
      total: Number(parsed.total) || parsed.fares.length,
      status: parsed.status as ObservedFaresCacheEntry["status"] || "healthy",
      latestObservedAt: parsed.latestObservedAt,
      feedAgeMinutes: parsed.feedAgeMinutes,
    };
  } catch {
    return undefined;
  }
}

export function writeObservedFaresCache(storage: Storage | undefined, entry: Omit<ObservedFaresCacheEntry, "savedAt">, now = Date.now()): void {
  storage?.setItem("farely.observed-cache", JSON.stringify({ ...entry, savedAt: now } satisfies ObservedFaresCacheEntry));
}
