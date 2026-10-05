import { describe, expect, it } from "vitest";

import { clearBookmarkedDeals, getBookmarkedDealIds, getLocalSavedRecord, isBookmarkedDeal, saveRemoteBookmark, toggleBookmarkedDeal } from "./bookmarks";

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  };
}

describe("deal bookmarks", () => {
  it("toggles and persists ids without duplicates", () => {
    const store = storage();
    expect(toggleBookmarkedDeal("a", store)).toBe(true);
    expect(toggleBookmarkedDeal("a", store)).toBe(false);
    expect(toggleBookmarkedDeal("a", store)).toBe(true);
    expect(toggleBookmarkedDeal("b", store)).toBe(true);
    expect(getBookmarkedDealIds(store)).toEqual(["a", "b"]);
    expect(isBookmarkedDeal("a", store)).toBe(true);
  });

  it("recovers from malformed storage and can clear all ids", () => {
    const store = storage();
    store.setItem("flycheap.bookmarked-deals", "not-json");
    expect(getBookmarkedDealIds(store)).toEqual([]);
    toggleBookmarkedDeal("a", store);
    clearBookmarkedDeals(store);
    expect(getBookmarkedDealIds(store)).toEqual([]);
  });

  it("persists snapshotData alongside local toggle and cleans up on untoggle", () => {
    const store = storage();
    const snapshot = {
      opportunityId: "HAN:BKK:2026-10-19:VN:0",
      fromCode: "HAN",
      toCode: "BKK",
      savedPrice: 4500000,
    };
    expect(toggleBookmarkedDeal("HAN:BKK:2026-10-19:VN:0", store, snapshot)).toBe(true);
    const record = getLocalSavedRecord("HAN:BKK:2026-10-19:VN:0", store);
    expect(record).toBeDefined();
    expect(record?.snapshotData?.savedPrice).toBe(4500000);

    // Untoggle cleans up snapshot
    expect(toggleBookmarkedDeal("HAN:BKK:2026-10-19:VN:0", store)).toBe(false);
    expect(getLocalSavedRecord("HAN:BKK:2026-10-19:VN:0", store)).toBeUndefined();
  });

  it("fails closed when remote persistence is not configured or fails", async () => {
    // When Supabase is not configured or fails, saveRemoteBookmark returns false
    const result = await saveRemoteBookmark("opp-123", true);
    expect(typeof result).toBe("boolean");
    // Default in test environment without auth session is false (fail closed)
    expect(result).toBe(false);
  });
});

