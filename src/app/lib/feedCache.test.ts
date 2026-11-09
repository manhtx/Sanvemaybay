import { describe, expect, it } from "vitest";
import {
  FEED_CACHE_TTL_MS,
  FeedCacheEntry,
  ObservedFaresCacheEntry,
  readFeedCache,
  readObservedFaresCache,
  writeFeedCache,
  writeObservedFaresCache,
} from "./feedCache";

function createMockStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    get length() {
      return values.size;
    },
  };
}

const mockDeal = {
  id: "deal-1",
  route: "HAN-BKK",
  origin: "HAN",
  destination: "BKK",
  price: 2_500_000,
  departDate: "2026-10-01",
} as any;

describe("feedCache (NC-007, REQ-DOM-001, REQ-DOM-008)", () => {
  describe("readFeedCache & writeFeedCache: 15-minute TTL and brand migration", () => {
    it("round-trips fresh cache entries and preserves all deal properties", () => {
      const store = createMockStorage();
      writeFeedCache(store, [mockDeal], 1000);

      const cached = readFeedCache(store, 1000 + 500);
      expect(cached).toBeDefined();
      expect(cached?.savedAt).toBe(1000);
      expect(cached?.deals).toHaveLength(1);
      expect(cached?.deals[0].id).toBe("deal-1");
      expect(cached?.deals[0].price).toBe(2_500_000);
    });

    it("expires cache entries strictly after 15 minutes (FEED_CACHE_TTL_MS) (NC-007)", () => {
      const store = createMockStorage();
      writeFeedCache(store, [mockDeal], 1000);

      // Exactly at TTL -> valid
      expect(readFeedCache(store, 1000 + FEED_CACHE_TTL_MS)).toBeDefined();

      // TTL + 1 ms -> expired
      expect(readFeedCache(store, 1000 + FEED_CACHE_TTL_MS + 1)).toBeUndefined();
    });

    it("falls back to legacy flycheap.feed-cache key when farely key is absent", () => {
      const legacyEntry: FeedCacheEntry = {
        savedAt: 1000,
        deals: [mockDeal],
      };
      const store = createMockStorage({
        "flycheap.feed-cache": JSON.stringify(legacyEntry),
      });

      const cached = readFeedCache(store, 1000 + 1000);
      expect(cached).toBeDefined();
      expect(cached?.deals).toHaveLength(1);
    });

    it("rejects malformed feed cache entries (missing savedAt or non-array deals)", () => {
      const store = createMockStorage({
        "farely.feed-cache": JSON.stringify({ savedAt: "invalid", deals: [mockDeal] }),
      });
      expect(readFeedCache(store, 2000)).toBeUndefined();

      const notArrayStore = createMockStorage({
        "farely.feed-cache": JSON.stringify({ savedAt: 1000, deals: "not-an-array" }),
      });
      expect(readFeedCache(notArrayStore, 2000)).toBeUndefined();
    });

    it("recovers gracefully from corrupted JSON in feed cache", () => {
      const corruptStore = createMockStorage({
        "farely.feed-cache": "{ invalid json corrupt content",
      });
      expect(readFeedCache(corruptStore, 1000)).toBeUndefined();
    });

    it("handles undefined storage argument cleanly", () => {
      expect(readFeedCache(undefined, 1000)).toBeUndefined();
      expect(() => writeFeedCache(undefined, [mockDeal], 1000)).not.toThrow();
    });
  });

  describe("readObservedFaresCache & writeObservedFaresCache: staleness gating and metadata", () => {
    it("round-trips observed fares with status, totals, and observational metadata", () => {
      const store = createMockStorage();
      writeObservedFaresCache(store, {
        fares: [mockDeal],
        total: 1,
        status: "degraded_freshness",
        latestObservedAt: "2026-09-01T12:00:00Z",
        feedAgeMinutes: 45,
      }, 5000);

      const cached = readObservedFaresCache(store, 5000 + 1000);
      expect(cached).toBeDefined();
      expect(cached?.savedAt).toBe(5000);
      expect(cached?.fares).toHaveLength(1);
      expect(cached?.total).toBe(1);
      expect(cached?.status).toBe("degraded_freshness");
      expect(cached?.latestObservedAt).toBe("2026-09-01T12:00:00Z");
      expect(cached?.feedAgeMinutes).toBe(45);
    });

    it("controls degraded staleness via allowStale flag (NC-007)", () => {
      const store = createMockStorage();
      writeObservedFaresCache(store, {
        fares: [mockDeal],
        total: 1,
        status: "healthy",
      }, 1000);

      const expiredTime = 1000 + FEED_CACHE_TTL_MS + 5000;

      // Without allowStale: returns undefined
      expect(readObservedFaresCache(store, expiredTime, false)).toBeUndefined();

      // With allowStale: returns the expired cache entry
      const stale = readObservedFaresCache(store, expiredTime, true);
      expect(stale).toBeDefined();
      expect(stale?.fares).toHaveLength(1);
      expect(stale?.status).toBe("healthy");
    });

    it("falls back to legacy flycheap.observed-cache key when farely key is absent", () => {
      const legacyObserved: ObservedFaresCacheEntry = {
        savedAt: 2000,
        fares: [mockDeal],
        total: 1,
        status: "stale_only",
      };
      const store = createMockStorage({
        "flycheap.observed-cache": JSON.stringify(legacyObserved),
      });

      const cached = readObservedFaresCache(store, 2000 + 100);
      expect(cached).toBeDefined();
      expect(cached?.status).toBe("stale_only");
    });

    it("defaults status to healthy when status is omitted in stored cache", () => {
      const store = createMockStorage({
        "farely.observed-cache": JSON.stringify({ savedAt: 1000, fares: [mockDeal] }),
      });
      const cached = readObservedFaresCache(store, 1500);
      expect(cached?.status).toBe("healthy");
      expect(cached?.total).toBe(1);
    });

    it("recovers gracefully from corrupted JSON in observed fares cache", () => {
      const corruptStore = createMockStorage({
        "farely.observed-cache": "{ broken json syntax",
      });
      expect(readObservedFaresCache(corruptStore, 1000)).toBeUndefined();
    });

    it("handles undefined storage argument cleanly for observed fares cache", () => {
      expect(readObservedFaresCache(undefined, 1000)).toBeUndefined();
      expect(() => writeObservedFaresCache(undefined, { fares: [], total: 0, status: "healthy" }, 1000)).not.toThrow();
    });
  });
});
