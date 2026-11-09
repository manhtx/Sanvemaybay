import { describe, expect, it } from "vitest";
import {
  collectExhaustiveKeyset,
  paginateKeyset,
  KeysetRow,
  KeysetCursor,
} from "./exhaustiveAnalyzer";

describe("Analyzer Exhaustiveness & Stable Keyset Pagination (Section 27)", () => {
  it("Negative Control: processes >300 eligible rows with tied timestamps exactly once with zero loss", async () => {
    // Generate 750 rows with multiple clusters of identical timestamps across page boundaries
    const allCorpus: KeysetRow[] = [];

    // Timestamps: e.g. 15 distinct timestamps, 50 rows per timestamp
    for (let t = 15; t >= 1; t--) {
      const isoTime = `2026-10-05T${String(t).padStart(2, "0")}:00:00.000Z`;
      for (let i = 50; i >= 1; i--) {
        allCorpus.push({
          id: `id-t${t}-idx${String(i).padStart(3, "0")}`,
          timestamp: isoTime,
          price: 2000000 + t * 10000 + i,
        });
      }
    }

    // Sort descending by timestamp, then id
    allCorpus.sort((a, b) => {
      if (a.timestamp !== b.timestamp) return b.timestamp.localeCompare(a.timestamp);
      return b.id.localeCompare(a.id);
    });

    expect(allCorpus.length).toBe(750);

    // Mock fetchPage simulating Supabase DB query with stable keyset filtering
    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(allCorpus, cursor, batchLimit);
    };

    // Run exhaustive collector with batch page size of 100 (which will cross tied-timestamp clusters)
    const result = await collectExhaustiveKeyset(fetchPage, {
      pageSize: 100,
      maxRows: 5000,
    });

    expect(result.rows.length).toBe(750);
    expect(result.hasMore).toBe(false);
    expect(result.isPartial).toBe(false);
    expect(result.continuation).toBeNull();

    // Verify all row IDs are present and unique
    const uniqueIds = new Set(result.rows.map((r) => r.id));
    expect(uniqueIds.size).toBe(750);

    // Verify order is strictly maintained
    for (let i = 0; i < result.rows.length - 1; i++) {
      const curr = result.rows[i];
      const next = result.rows[i + 1];
      const timeDiff = curr.timestamp.localeCompare(next.timestamp);
      if (timeDiff === 0) {
        expect(curr.id.localeCompare(next.id)).toBeGreaterThan(0);
      } else {
        expect(timeDiff).toBeGreaterThan(0);
      }
    }
  });

  it("Marks partial state and provides continuation cursor when operational ceiling is hit", async () => {
    const allCorpus: KeysetRow[] = Array.from({ length: 500 }, (_, i) => ({
      id: `id-${String(i).padStart(4, "0")}`,
      timestamp: new Date(1760000000000 - i * 1000).toISOString(),
    }));

    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(allCorpus, cursor, batchLimit);
    };

    // Hard ceiling of 250 rows
    const firstRun = await collectExhaustiveKeyset(fetchPage, {
      pageSize: 100,
      maxRows: 250,
    });

    expect(firstRun.rows.length).toBe(250);
    expect(firstRun.isPartial).toBe(true);
    expect(firstRun.hasMore).toBe(true);
    expect(firstRun.continuation).not.toBeNull();

    // Continue with second run
    const secondRun = await collectExhaustiveKeyset(fetchPage, {
      pageSize: 100,
      maxRows: 300,
      initialCursor: firstRun.continuation,
    });

    expect(secondRun.rows.length).toBe(250);
    expect(secondRun.hasMore).toBe(false);
    expect(secondRun.isPartial).toBe(false);

    // Combined rows must equal 500 unique items
    const combined = [...firstRun.rows, ...secondRun.rows];
    expect(combined.length).toBe(500);
    const combinedIds = new Set(combined.map((r) => r.id));
    expect(combinedIds.size).toBe(500);
  });

  it("handles empty corpus pagination and collection cleanly without errors", async () => {
    const emptyRows: KeysetRow[] = [];
    expect(paginateKeyset(emptyRows, null, 100)).toEqual([]);

    const fetchPage = async () => [];
    const result = await collectExhaustiveKeyset(fetchPage, { pageSize: 50 });

    expect(result.rows).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.isPartial).toBe(false);
    expect(result.continuation).toBeNull();
  });

  it("handles single-item corpus pagination and exhaustion without false loops", async () => {
    const singleCorpus: KeysetRow[] = [
      { id: "single-1", timestamp: "2026-10-05T10:00:00.000Z" }
    ];

    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(singleCorpus, cursor, batchLimit);
    };

    const result = await collectExhaustiveKeyset(fetchPage, { pageSize: 10 });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].id).toBe("single-1");
    expect(result.hasMore).toBe(false);
    expect(result.isPartial).toBe(false);
    expect(result.continuation).toBeNull();

    // Slicing after single-item cursor returns empty array
    const after = paginateKeyset(singleCorpus, {
      cursor_timestamp: "2026-10-05T10:00:00.000Z",
      cursor_id: "single-1"
    });
    expect(after).toEqual([]);
  });

  it("applies default batch limit of 300 when limit argument is omitted", () => {
    const rows: KeysetRow[] = Array.from({ length: 400 }, (_, i) => ({
      id: `id-${i}`,
      timestamp: "2026-10-05T10:00:00.000Z"
    }));

    const paginated = paginateKeyset(rows);
    expect(paginated.length).toBe(300);
  });

  it("returns empty array when cursor timestamp is strictly older than any corpus record", () => {
    const corpus: KeysetRow[] = [
      { id: "row-1", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "row-2", timestamp: "2026-10-05T11:00:00.000Z" }
    ];

    const outOfBoundsCursor: KeysetCursor = {
      cursor_timestamp: "2026-10-05T09:00:00.000Z",
      cursor_id: "any-id"
    };

    const paginated = paginateKeyset(corpus, outOfBoundsCursor, 50);
    expect(paginated).toEqual([]);
  });

  it("returns empty array when cursor matches exact tail boundary record (zero off-by-one re-reads)", () => {
    const corpus: KeysetRow[] = [
      { id: "row-1", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "row-2", timestamp: "2026-10-05T11:00:00.000Z" }
    ];

    const tailCursor: KeysetCursor = {
      cursor_timestamp: "2026-10-05T11:00:00.000Z",
      cursor_id: "row-2"
    };

    const paginated = paginateKeyset(corpus, tailCursor, 50);
    expect(paginated).toEqual([]);
  });

  it("supports legacy timestamp-only cursor fallback without cursor_id", () => {
    const corpus: KeysetRow[] = [
      { id: "row-3", timestamp: "2026-10-05T13:00:00.000Z" },
      { id: "row-2", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "row-1", timestamp: "2026-10-05T11:00:00.000Z" }
    ];

    const legacyCursor = { cursor_timestamp: "2026-10-05T12:00:00.000Z" } as KeysetCursor;
    const paginated = paginateKeyset(corpus, legacyCursor, 50);

    expect(paginated.length).toBe(1);
    expect(paginated[0].id).toBe("row-1");
  });

  it("traverses 20 tied-timestamp rows across micro-batches (batch size 3) with zero duplicates or drops", async () => {
    // 20 items with the exact same timestamp, ordered by ID desc
    const tiedCorpus: KeysetRow[] = Array.from({ length: 20 }, (_, i) => ({
      id: `tied-${String(20 - i).padStart(2, "0")}`,
      timestamp: "2026-10-05T12:00:00.000Z"
    }));

    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(tiedCorpus, cursor, batchLimit);
    };

    const result = await collectExhaustiveKeyset(fetchPage, {
      pageSize: 3,
      maxRows: 100
    });

    expect(result.rows.length).toBe(20);
    expect(result.hasMore).toBe(false);
    expect(result.isPartial).toBe(false);
    expect(result.continuation).toBeNull();

    // Verify all 20 unique IDs collected in exact order
    const ids = result.rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids[0]).toBe("tied-20");
    expect(ids[19]).toBe("tied-01");
  });

  it("resumes sequential continuation over multiple bounded runs without row loss", async () => {
    const corpus: KeysetRow[] = Array.from({ length: 100 }, (_, i) => ({
      id: `seq-${String(100 - i).padStart(3, "0")}`,
      timestamp: new Date(1760000000000 - i * 60000).toISOString()
    }));

    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(corpus, cursor, batchLimit);
    };

    // Run 1: maxRows = 40
    const run1 = await collectExhaustiveKeyset(fetchPage, { pageSize: 15, maxRows: 40 });
    expect(run1.rows.length).toBe(40);
    expect(run1.hasMore).toBe(true);
    expect(run1.isPartial).toBe(true);
    expect(run1.continuation).not.toBeNull();

    // Run 2: maxRows = 40
    const run2 = await collectExhaustiveKeyset(fetchPage, {
      pageSize: 15,
      maxRows: 40,
      initialCursor: run1.continuation
    });
    expect(run2.rows.length).toBe(40);
    expect(run2.hasMore).toBe(true);
    expect(run2.isPartial).toBe(true);

    // Run 3: maxRows = 40 (remaining 20 rows)
    const run3 = await collectExhaustiveKeyset(fetchPage, {
      pageSize: 15,
      maxRows: 40,
      initialCursor: run2.continuation
    });
    expect(run3.rows.length).toBe(20);
    expect(run3.hasMore).toBe(false);
    expect(run3.isPartial).toBe(false);
    expect(run3.continuation).toBeNull();

    const all = [...run1.rows, ...run2.rows, ...run3.rows];
    expect(all.length).toBe(100);
    expect(new Set(all.map((r) => r.id)).size).toBe(100);
  });

  it("processes 1,000 items in keyset collection within sub-50ms latency budget", async () => {
    const largeCorpus: KeysetRow[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `perf-${String(1000 - i).padStart(4, "0")}`,
      timestamp: new Date(1760000000000 - i * 1000).toISOString()
    }));

    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(largeCorpus, cursor, batchLimit);
    };

    const start = performance.now();
    const result = await collectExhaustiveKeyset(fetchPage, { pageSize: 200, maxRows: 1500 });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    expect(result.rows.length).toBe(1000);
    expect(result.hasMore).toBe(false);
  });

  it("preserves pure immutability on Object.freeze protected rows array", () => {
    const frozenRows = Object.freeze([
      Object.freeze({ id: "fr-2", timestamp: "2026-10-05T12:00:00.000Z" }),
      Object.freeze({ id: "fr-1", timestamp: "2026-10-05T11:00:00.000Z" })
    ]);

    expect(() => paginateKeyset(frozenRows as any, null, 10)).not.toThrow();
    expect(frozenRows[0].id).toBe("fr-2");
  });

  it("preserves arbitrary custom metadata payload fields on KeysetRow without dropping properties", async () => {
    interface RichKeysetRow extends KeysetRow {
      airline: string;
      fareClass: string;
      tags: string[];
      details: { score: number; seats: number };
    }

    const richRows: RichKeysetRow[] = [
      {
        id: "r-02",
        timestamp: "2026-10-05T12:00:00.000Z",
        airline: "VN",
        fareClass: "ECO",
        tags: ["deal", "direct"],
        details: { score: 92, seats: 4 },
      },
      {
        id: "r-01",
        timestamp: "2026-10-05T11:00:00.000Z",
        airline: "VJ",
        fareClass: "PROMO",
        tags: ["hot"],
        details: { score: 88, seats: 2 },
      },
    ];

    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(richRows, cursor, batchLimit);
    };

    const result = await collectExhaustiveKeyset(fetchPage, { pageSize: 10 });
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].airline).toBe("VN");
    expect(result.rows[0].tags).toEqual(["deal", "direct"]);
    expect(result.rows[0].details.score).toBe(92);
    expect(result.rows[1].airline).toBe("VJ");
    expect(result.rows[1].details.seats).toBe(2);
  });

  it("cursor stepping progresses strictly downward when batch contains identical timestamps and ids sorted descending", () => {
    const tiedCorpus: KeysetRow[] = [
      { id: "id-delta", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "id-charlie", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "id-bravo", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "id-alpha", timestamp: "2026-10-05T12:00:00.000Z" },
    ];

    const cursor: KeysetCursor = {
      cursor_timestamp: "2026-10-05T12:00:00.000Z",
      cursor_id: "id-charlie",
    };

    const nextBatch = paginateKeyset(tiedCorpus, cursor, 10);
    expect(nextBatch.length).toBe(2);
    expect(nextBatch[0].id).toBe("id-bravo");
    expect(nextBatch[1].id).toBe("id-alpha");
  });

  it("collectExhaustiveKeyset respects pageSize smaller than single timestamp cluster without infinite looping", async () => {
    // 12 items with exact same timestamp, batch size 5
    const tiedRows: KeysetRow[] = Array.from({ length: 12 }, (_, i) => ({
      id: `cluster-${String(12 - i).padStart(2, "0")}`,
      timestamp: "2026-10-05T15:00:00.000Z",
    }));

    let callCount = 0;
    const fetchPage = async (cursor: KeysetCursor | null, batchLimit: number) => {
      callCount++;
      return paginateKeyset(tiedRows, cursor, batchLimit);
    };

    const result = await collectExhaustiveKeyset(fetchPage, { pageSize: 5, maxRows: 50 });
    expect(result.rows.length).toBe(12);
    expect(result.hasMore).toBe(false);
    expect(result.isPartial).toBe(false);
    expect(callCount).toBe(3); // 5 + 5 + 2 = 12 items
  });

  it("collectExhaustiveKeyset terminates immediately when fetchPage returns empty array on initial call", async () => {
    let callCount = 0;
    const fetchPage = async () => {
      callCount++;
      return [];
    };

    const result = await collectExhaustiveKeyset(fetchPage, { pageSize: 100, maxRows: 1000 });
    expect(result.rows).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.isPartial).toBe(false);
    expect(result.continuation).toBeNull();
    expect(callCount).toBe(1);
  });

  it("pagination correctly filters multi-timestamp records across fine-grained time boundaries", () => {
    const corpus: KeysetRow[] = [
      { id: "a4", timestamp: "2026-10-05T14:00:00.000Z" },
      { id: "a3", timestamp: "2026-10-05T13:00:00.000Z" },
      { id: "a2", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "a1", timestamp: "2026-10-05T11:00:00.000Z" },
    ];

    const cursor: KeysetCursor = {
      cursor_timestamp: "2026-10-05T13:00:00.000Z",
      cursor_id: "a3",
    };

    const page = paginateKeyset(corpus, cursor, 2);
    expect(page.length).toBe(2);
    expect(page[0].id).toBe("a2");
    expect(page[1].id).toBe("a1");
  });

  it("maxRows exact boundary condition: distinguishes full completion vs partial ceiling accurately", async () => {
    // Case A: corpus has 40 items, maxRows is 50 (batch of 40 < batchLimit 50) -> full completion
    const smallerCorpus: KeysetRow[] = Array.from({ length: 40 }, (_, i) => ({
      id: `small-${String(40 - i).padStart(2, "0")}`,
      timestamp: new Date(1760000000000 - i * 1000).toISOString(),
    }));

    const fetchSmaller = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(smallerCorpus, cursor, batchLimit);
    };

    const resultA = await collectExhaustiveKeyset(fetchSmaller, { pageSize: 100, maxRows: 50 });
    expect(resultA.rows.length).toBe(40);
    expect(resultA.hasMore).toBe(false);
    expect(resultA.isPartial).toBe(false);
    expect(resultA.continuation).toBeNull();

    // Case B: corpus has 50 items, maxRows is 50 (batch returns 50 == batchLimit) -> correctly partial
    const exactCorpus: KeysetRow[] = Array.from({ length: 50 }, (_, i) => ({
      id: `exact-${String(50 - i).padStart(2, "0")}`,
      timestamp: new Date(1760000000000 - i * 1000).toISOString(),
    }));

    const fetchExact = async (cursor: KeysetCursor | null, batchLimit: number) => {
      return paginateKeyset(exactCorpus, cursor, batchLimit);
    };

    const resultB = await collectExhaustiveKeyset(fetchExact, { pageSize: 100, maxRows: 50 });
    expect(resultB.rows.length).toBe(50);
    expect(resultB.hasMore).toBe(true);
    expect(resultB.isPartial).toBe(true);
    expect(resultB.continuation).not.toBeNull();
  });

  it("keyset pagination handles zero or edge-case batch limits safely", () => {
    const corpus: KeysetRow[] = [
      { id: "row-1", timestamp: "2026-10-05T12:00:00.000Z" },
      { id: "row-2", timestamp: "2026-10-05T11:00:00.000Z" },
    ];

    expect(paginateKeyset(corpus, null, 0)).toEqual([]);
    expect(paginateKeyset(corpus, null, 1).length).toBe(1);
    expect(paginateKeyset(corpus, null, 10).length).toBe(2);
  });

  it("processes 5,000 keyset row batch pagination operations within sub-50ms latency budget", () => {
    const corpus: KeysetRow[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `perf-row-${String(5000 - i).padStart(4, "0")}`,
      timestamp: new Date(1760000000000 - i * 1000).toISOString(),
    }));

    const cursor: KeysetCursor = {
      cursor_timestamp: corpus[2500].timestamp,
      cursor_id: corpus[2500].id,
    };

    const start = performance.now();
    const result = paginateKeyset(corpus, cursor, 500);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    expect(result.length).toBe(500);
  });
});
