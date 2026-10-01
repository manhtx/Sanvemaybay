import { describe, expect, it } from "vitest";
import {
  FEED_CACHE_TTL_MS,
  readFeedCache,
  writeFeedCache,
  readObservedFaresCache,
  writeObservedFaresCache,
} from "./feedCache";

function storage(): Storage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), clear: () => values.clear(), key: (index) => [...values.keys()][index] ?? null, length: values.size } as Storage;
}

describe("feedCache", () => {
  it("round-trips fresh cache entries and expires stale entries", () => {
    const target = storage();
    writeFeedCache(target, [{ id: "deal" }] as any, 1000);
    expect(readFeedCache(target, 1000)?.deals).toHaveLength(1);
    expect(readFeedCache(target, 1000 + FEED_CACHE_TTL_MS + 1)).toBeUndefined();
  });

  it("round-trips observed fares cache with fallback", () => {
    const target = storage();
    writeObservedFaresCache(target, {
      fares: [{ id: "obs-1" }] as any,
      total: 1,
      status: "healthy",
    }, 1000);
    const fresh = readObservedFaresCache(target, 1000);
    expect(fresh?.fares).toHaveLength(1);
    expect(fresh?.total).toBe(1);
    expect(readObservedFaresCache(target, 1000 + FEED_CACHE_TTL_MS + 1)).toBeUndefined();
    expect(readObservedFaresCache(target, 1000 + FEED_CACHE_TTL_MS + 1, true)?.fares).toHaveLength(1);
  });
});
