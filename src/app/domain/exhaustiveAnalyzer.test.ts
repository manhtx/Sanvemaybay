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
});
