import { Deal } from "../data/deals";

export interface FeedCacheEntry {
  savedAt: number;
  deals: Deal[];
}

export const FEED_CACHE_TTL_MS = 15 * 60 * 1000;

export function readFeedCache(storage: Storage | undefined, now = Date.now()): FeedCacheEntry | undefined {
  if (!storage) return undefined;
  try {
    const parsed = JSON.parse(storage.getItem("flycheap.feed-cache") ?? "null") as Partial<FeedCacheEntry> | null;
    if (!parsed || !Number.isFinite(parsed.savedAt) || !Array.isArray(parsed.deals) || now - Number(parsed.savedAt) > FEED_CACHE_TTL_MS) return undefined;
    return { savedAt: Number(parsed.savedAt), deals: parsed.deals as Deal[] };
  } catch {
    return undefined;
  }
}

export function writeFeedCache(storage: Storage | undefined, deals: Deal[], now = Date.now()): void {
  storage?.setItem("flycheap.feed-cache", JSON.stringify({ savedAt: now, deals } satisfies FeedCacheEntry));
}
