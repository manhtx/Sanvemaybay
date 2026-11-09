import { describe, expect, it } from "vitest";

import {
  clearBookmarkedDeals,
  createOpportunitySnapshot,
  getBookmarkedDealIds,
  getLocalSavedRecord,
  isBookmarkedDeal,
  mergeLocalBookmarksIntoServer,
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

describe("deal bookmarks (REQ-SAVED-001, REQ-SAVED-002, NC-030)", () => {
  it("creates opportunity snapshot with all explicit fields", () => {
    const deal = {
      opportunityId: "HAN:BKK:2026-10-19:VN:0",
      fromCode: "HAN",
      toCode: "BKK",
      from: "Hà Nội",
      to: "Bangkok",
      departDate: "2026-10-19",
      returnDate: "2026-10-25",
      price: 3200000,
      normalPrice: 5000000,
      airline: "Vietnam Airlines",
      airlineCode: "VN",
      flightNumber: "VN611",
      stops: 0,
      duration: "2h 00m",
      expiresIn: "còn 4 giờ",
      observedAt: "2026-10-19T06:00:00.000Z",
      comparator: {
        cohortMedian: 4800000,
        isSufficient: true,
      },
      discount: 36,
    };

    const snapshot = createOpportunitySnapshot(deal);
    expect(snapshot.opportunityId).toBe("HAN:BKK:2026-10-19:VN:0");
    expect(snapshot.fromCode).toBe("HAN");
    expect(snapshot.toCode).toBe("BKK");
    expect(snapshot.fromCity).toBe("Hà Nội");
    expect(snapshot.toCity).toBe("Bangkok");
    expect(snapshot.departDate).toBe("2026-10-19");
    expect(snapshot.returnDate).toBe("2026-10-25");
    expect(snapshot.savedPrice).toBe(3200000);
    expect(snapshot.normalPrice).toBe(5000000);
    expect(snapshot.airline).toBe("Vietnam Airlines");
    expect(snapshot.airlineCode).toBe("VN");
    expect(snapshot.flightNumber).toBe("VN611");
    expect(snapshot.stops).toBe(0);
    expect(snapshot.duration).toBe("2h 00m");
    expect(snapshot.comparatorContext.cohortMedian).toBe(4800000);
    expect(snapshot.comparatorContext.isSufficient).toBe(true);
    expect(snapshot.comparatorContext.discountPercentage).toBe(36);
    expect(snapshot.evidenceContext.freshnessText).toBe("còn 4 giờ");
    expect(snapshot.evidenceContext.observedAt).toBe("2026-10-19T06:00:00.000Z");
  });

  it("creates opportunity snapshot with defensive fallback defaults for missing fields", () => {
    const minimalDeal = {
      id: "SGN:SIN:2026-11-01",
      fromCode: "SGN",
      toCode: "SIN",
      departDate: "2026-11-01",
      confidence: 0.75,
    };

    const snapshot = createOpportunitySnapshot(minimalDeal);
    expect(snapshot.opportunityId).toBe("SGN:SIN:2026-11-01");
    expect(snapshot.savedPrice).toBe(0);
    expect(snapshot.normalPrice).toBe(0);
    expect(snapshot.returnDate).toBeNull();
    expect(snapshot.airline).toBe("");
    expect(snapshot.airlineCode).toBe("");
    expect(snapshot.flightNumber).toBe("");
    expect(snapshot.stops).toBe(0);
    expect(snapshot.duration).toBe("");
    expect(snapshot.comparatorContext.cohortMedian).toBeNull();
    expect(snapshot.comparatorContext.isSufficient).toBe(true); // derived from confidence >= 0.5
    expect(snapshot.evidenceContext.freshnessText).toBe("");
    expect(snapshot.evidenceContext.observedAt).toBeNull();
  });

  it("derives isSufficient as false when confidence < 0.5 and comparator is missing", () => {
    const lowConfidenceDeal = {
      opportunityId: "DAD:BKK:2026-12-01",
      fromCode: "DAD",
      toCode: "BKK",
      departDate: "2026-12-01",
      confidence: 0.3,
    };

    const snapshot = createOpportunitySnapshot(lowConfidenceDeal);
    expect(snapshot.comparatorContext.isSufficient).toBe(false);
  });

  it("toggles and persists ids without duplicates", () => {
    const store = storage();
    expect(toggleBookmarkedDeal("a", store)).toBe(true);
    expect(toggleBookmarkedDeal("a", store)).toBe(false);
    expect(toggleBookmarkedDeal("a", store)).toBe(true);
    expect(toggleBookmarkedDeal("b", store)).toBe(true);
    expect(getBookmarkedDealIds(store)).toEqual(["a", "b"]);
    expect(isBookmarkedDeal("a", store)).toBe(true);
    expect(isBookmarkedDeal("c", store)).toBe(false);
  });

  it("recovers from malformed storage and can clear all ids", () => {
    const store = storage();
    store.setItem("flycheap.bookmarked-deals", "not-json");
    expect(getBookmarkedDealIds(store)).toEqual([]);
    toggleBookmarkedDeal("a", store);
    clearBookmarkedDeals(store);
    expect(getBookmarkedDealIds(store)).toEqual([]);
  });

  it("reads from legacy storage key when primary storage key is not set", () => {
    const store = storage();
    store.setItem("flycheap.bookmarked-deals", JSON.stringify(["legacy-1", "legacy-2"]));
    expect(getBookmarkedDealIds(store)).toEqual(["legacy-1", "legacy-2"]);
    expect(isBookmarkedDeal("legacy-1", store)).toBe(true);
  });

  it("filters non-string elements from stored arrays defensively", () => {
    const store = storage();
    store.setItem("farely.saved-opportunities", JSON.stringify([123, null, "valid-id", {}, true, "valid-id-2"]));
    expect(getBookmarkedDealIds(store)).toEqual(["valid-id", "valid-id-2"]);
  });

  it("returns empty array when storage is undefined", () => {
    expect(getBookmarkedDealIds(undefined)).toEqual([]);
    expect(isBookmarkedDeal("any-id", undefined)).toBe(false);
    expect(getLocalSavedRecord("any-id", undefined)).toBeUndefined();
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

  it("maintains isolation: untoggling one opportunity does not affect other snapshots", () => {
    const store = storage();
    const snap1 = { opportunityId: "deal-1", savedPrice: 1000000 };
    const snap2 = { opportunityId: "deal-2", savedPrice: 2000000 };

    toggleBookmarkedDeal("deal-1", store, snap1);
    toggleBookmarkedDeal("deal-2", store, snap2);

    expect(isBookmarkedDeal("deal-1", store)).toBe(true);
    expect(isBookmarkedDeal("deal-2", store)).toBe(true);
    expect(getLocalSavedRecord("deal-1", store)?.snapshotData?.savedPrice).toBe(1000000);
    expect(getLocalSavedRecord("deal-2", store)?.snapshotData?.savedPrice).toBe(2000000);

    // Untoggle deal-1 only
    toggleBookmarkedDeal("deal-1", store);

    expect(isBookmarkedDeal("deal-1", store)).toBe(false);
    expect(isBookmarkedDeal("deal-2", store)).toBe(true);
    expect(getLocalSavedRecord("deal-1", store)).toBeUndefined();
    expect(getLocalSavedRecord("deal-2", store)?.snapshotData?.savedPrice).toBe(2000000);
  });

  it("clearBookmarkedDeals removes all primary, legacy, and snapshot storage keys", () => {
    const store = storage();
    toggleBookmarkedDeal("deal-1", store, { price: 100 });
    store.setItem("flycheap.bookmarked-deals", JSON.stringify(["legacy"]));

    clearBookmarkedDeals(store);

    expect(store.getItem("farely.saved-opportunities")).toBeNull();
    expect(store.getItem("flycheap.bookmarked-deals")).toBeNull();
    expect(store.getItem("farely.saved-snapshots")).toBeNull();
    expect(getBookmarkedDealIds(store)).toEqual([]);
  });

  it("fails closed when remote persistence is not configured or fails", async () => {
    const result = await saveRemoteBookmark("opp-123", true);
    expect(typeof result).toBe("boolean");
    expect(result).toBe(false);
  });

  it("fails closed when mergeLocalBookmarksIntoServer runs without auth session", async () => {
    const store = storage();
    toggleBookmarkedDeal("local-1", store);
    const result = await mergeLocalBookmarksIntoServer(store);
    // When unconfigured or no session, returns false
    expect(result).toBe(false);
  });

  it("NC-030: rolls back optimistic bookmark when remote mutation fails", async () => {
    const store = storage();
    let rollbackTriggered = false;
    let rollbackPrevState: boolean | null = null;

    expect(isBookmarkedDeal("opp-fail", store)).toBe(false);

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

  it("no-ops cleanly when targetState matches existing bookmark state", async () => {
    const store = storage();
    toggleBookmarkedDeal("deal-exists", store, { price: 500 });

    const result = await mutateBookmarkOptimistic("deal-exists", true, undefined, store);
    expect(result.success).toBe(true);
    expect(result.bookmarked).toBe(true);
    expect(result.rolledBack).toBeUndefined();
  });

  it("preserves immutability: Object.freeze on deal and snapshot objects does not fail", () => {
    const frozenDeal = Object.freeze({
      opportunityId: "FROZEN:001",
      fromCode: "HAN",
      toCode: "DAD",
      departDate: "2026-10-20",
      price: 1200000,
      normalPrice: 1800000,
    });

    const snapshot = createOpportunitySnapshot(frozenDeal);
    expect(snapshot.opportunityId).toBe("FROZEN:001");
    expect(snapshot.savedPrice).toBe(1200000);
    expect(frozenDeal.price).toBe(1200000);
  });

  it("performance benchmark: 1,000 snapshot creations execute in < 50ms", () => {
    const rawDeal = {
      opportunityId: "HAN:BKK:2026-10-19:VN:0",
      fromCode: "HAN",
      toCode: "BKK",
      fromCity: "Hà Nội",
      toCity: "Bangkok",
      departDate: "2026-10-19",
      price: 3200000,
      normalPrice: 5000000,
      confidence: 0.8,
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      createOpportunitySnapshot(rawDeal);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });

  it("toggleBookmarkedDeal idempotency: rapid sequential toggling alternates state cleanly", () => {
    const store = storage();
    const dealId = "rapid-toggle-deal";
    const sampleDeal = { price: 2000000, fromCode: "HAN", toCode: "BKK" };

    // Initial state: not bookmarked
    expect(isBookmarkedDeal(dealId, store)).toBe(false);

    // Toggle 1: Added
    const r1 = toggleBookmarkedDeal(dealId, store, sampleDeal);
    expect(r1).toBe(true);
    expect(isBookmarkedDeal(dealId, store)).toBe(true);
    expect(getBookmarkedDealIds(store)).toContain(dealId);

    // Toggle 2: Removed
    const r2 = toggleBookmarkedDeal(dealId, store);
    expect(r2).toBe(false);
    expect(isBookmarkedDeal(dealId, store)).toBe(false);
    expect(getBookmarkedDealIds(store)).not.toContain(dealId);

    // Toggle 3: Re-added
    const r3 = toggleBookmarkedDeal(dealId, store, sampleDeal);
    expect(r3).toBe(true);
    expect(isBookmarkedDeal(dealId, store)).toBe(true);
  });

  it("scale stress test: 20,000 snapshot creations execute in < 100ms", () => {
    const rawDeal = {
      opportunityId: "SGN:NRT:2026-11-20:VJ:0",
      fromCode: "SGN",
      toCode: "NRT",
      departDate: "2026-11-20",
      price: 4500000,
      normalPrice: 7000000,
      confidence: 0.9,
    };

    const start = performance.now();
    for (let i = 0; i < 20000; i++) {
      createOpportunitySnapshot(rawDeal);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
