import { describe, expect, it } from "vitest";

import {
  clearBookmarkedDeals,
  getBookmarkedDealIds,
  getLocalSavedRecord,
  isBookmarkedDeal,
  mutateBookmarkOptimistic,
  saveRemoteBookmark,
  toggleBookmarkedDeal,
} from "./bookmarks";

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

  it("NC-030: rolls back optimistic bookmark when remote mutation fails", async () => {
    const store = storage();
    let rollbackTriggered = false;
    let rollbackPrevState: boolean | null = null;

    // Initially not bookmarked
    expect(isBookmarkedDeal("opp-fail", store)).toBe(false);

    // Mock remote failure (e.g. network error / 500)
    const result = await mutateBookmarkOptimistic(
      "opp-fail",
      true,
      { savedPrice: 1200000 },
      store,
      {
        mockRemoteSaver: async () => false,
        onRollback: (prev, _err) => {
          rollbackTriggered = true;
          rollbackPrevState = prev;
        },
      }
    );

    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(rollbackTriggered).toBe(true);
    expect(rollbackPrevState).toBe(false);
    // Local storage was rolled back to false!
    expect(isBookmarkedDeal("opp-fail", store)).toBe(false);
    expect(getLocalSavedRecord("opp-fail", store)).toBeUndefined();
  });

  it("NC-030: commits state when remote mutation succeeds", async () => {
    const store = storage();
    const result = await mutateBookmarkOptimistic(
      "opp-ok",
      true,
      { savedPrice: 1500000 },
      store,
      {
        mockRemoteSaver: async () => true,
      }
    );

    expect(result.success).toBe(true);
    expect(result.rolledBack).toBeUndefined();
    expect(isBookmarkedDeal("opp-ok", store)).toBe(true);
    expect(getLocalSavedRecord("opp-ok", store)?.snapshotData?.savedPrice).toBe(1500000);
  });
});

