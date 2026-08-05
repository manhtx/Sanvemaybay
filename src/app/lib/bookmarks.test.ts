import { describe, expect, it } from "vitest";
import { clearBookmarkedDeals, getBookmarkedDealIds, isBookmarkedDeal, toggleBookmarkedDeal } from "./bookmarks";

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
});
