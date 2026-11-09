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
});
