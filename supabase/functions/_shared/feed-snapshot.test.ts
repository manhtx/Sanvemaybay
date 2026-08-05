import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FEED_SNAPSHOT_TTL_MS, shouldRefreshSnapshot } from "./feed-snapshot.ts";

Deno.test("refreshes missing, stale and malformed snapshots only", () => {
  const now = Date.parse("2026-08-01T00:15:00Z");
  assert(shouldRefreshSnapshot(undefined, now));
  assert(shouldRefreshSnapshot("invalid", now));
  assert(shouldRefreshSnapshot(new Date(now - FEED_SNAPSHOT_TTL_MS).toISOString(), now));
  assertEquals(shouldRefreshSnapshot(new Date(now - 1_000).toISOString(), now), false);
});
