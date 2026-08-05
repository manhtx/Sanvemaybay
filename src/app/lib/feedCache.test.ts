import { describe, expect, it } from "vitest";
import { FEED_CACHE_TTL_MS, readFeedCache, writeFeedCache } from "./feedCache";

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
});
