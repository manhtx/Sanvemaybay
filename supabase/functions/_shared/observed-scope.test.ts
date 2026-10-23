import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { applyObservedScope, isSafeObservedTextFilter, type ObservedQueryScope } from "./observed-scope.ts";

class Capture implements ObservedQueryScope {
  calls: string[] = [];
  eq(column: string, value: unknown): this { this.calls.push("eq:" + column + ":" + String(value)); return this; }
  is(column: string, value: unknown): this { this.calls.push("is:" + column + ":" + String(value)); return this; }
  or(filters: string): this { this.calls.push("or:" + filters); return this; }
  gte(column: string, value: unknown): this { this.calls.push("gte:" + column + ":" + String(value)); return this; }
  lte(column: string, value: unknown): this { this.calls.push("lte:" + column + ":" + String(value)); return this; }
  lt(column: string, value: unknown): this { this.calls.push("lt:" + column + ":" + String(value)); return this; }
}

Deno.test("freshness, page and RouteBest queries share an identical scoped predicate", () => {
  const input = { origin: "HAN", destination: "BKK", depart_date_from: "2026-11-01",
    depart_date_to: "2026-11-03", return_date: "2026-11-07", max_stops: 1, currency: "vnd" };
  const page = applyObservedScope(new Capture(), input);
  const latest = applyObservedScope(new Capture(), input);
  const best = applyObservedScope(new Capture(), input);
  assertEquals(page.calls, latest.calls);
  assertEquals(latest.calls, best.calls);
  assert(page.calls.includes("eq:origin_code:HAN"));
  assert(page.calls.includes("eq:destination_code:BKK"));
  assert(page.calls.includes("eq:return_date:2026-11-07"));
  assert(page.calls.includes("lte:stops:1"));
  assert(page.calls.includes("eq:currency:VND"));
});

Deno.test("null stops never become a direct-only filter", () => {
  const q = applyObservedScope(new Capture(), { max_stops: null, direct_only: false });
  assert(!q.calls.some((x) => x.startsWith("lte:stops") || x === "eq:stops:0"));
  const direct = applyObservedScope(new Capture(), { direct_only: true });
  assert(direct.calls.includes("eq:stops:0"));
});

Deno.test("a scoped date window does not reuse a separate route or other generation", () => {
  const old = applyObservedScope(new Capture(), { origin: "HAN", destination: "ICN", depart_date_from: "2026-12-14" });
  const other = applyObservedScope(new Capture(), { origin: "SGN", destination: "ICN", depart_date_from: "2026-12-14" });
  assert(old.calls.includes("eq:origin_code:HAN"));
  assert(other.calls.includes("eq:origin_code:SGN"));
  assert(old.calls.join("|") !== other.calls.join("|"));
});

Deno.test("malformed PostgREST OR terms fail closed", () => {
  for (const s of ["BKK),origin_code.eq.SGN", "BKK%20", "x_y", "x.y", "too,wide"]) {
    assertEquals(isSafeObservedTextFilter(s), false);
    assertThrows(() => applyObservedScope(new Capture(), { search_text: s }), RangeError);
  }
  assertEquals(isSafeObservedTextFilter("Hồ Chí Minh"), true);
});

Deno.test("the deployed query code uses the scoped oracle, not generation-wide freshness", async () => {
  const src = await Deno.readTextFile(new URL("../observed-fares/index.ts", import.meta.url));
  assert(src.includes("const latestQuery = applyObservedScope("));
  assert(src.includes("let query = applyObservedScope("));
  assert(src.includes("let bestQuery = applyObservedScope(") || src.includes("const bestQuery = applyObservedScope("));
  assert(!src.includes("row.stops ?? 0"));
});

Deno.test("D4: exact-ID resolution correctly parses 7-component canonical opportunity IDs", () => {
  // Round-trip 7-component
  const q1 = applyObservedScope(new Capture(), { id: "observed-HAN:SGN:2026-11-01:2026-11-05:VN:VN123:0" });
  assertEquals(q1.calls, [
    "eq:origin_code:HAN",
    "eq:destination_code:SGN",
    "eq:depart_date:2026-11-01",
    "eq:return_date:2026-11-05",
    "eq:airline_code:VN",
    "eq:flight_number:VN123",
    "eq:stops:0",
  ]);

  // One-way 7-component (empty return date -> is:return_date:null)
  const q2 = applyObservedScope(new Capture(), { id: "HAN:SGN:2026-11-01::VN:VN123:0" });
  assertEquals(q2.calls, [
    "eq:origin_code:HAN",
    "eq:destination_code:SGN",
    "eq:depart_date:2026-11-01",
    "is:return_date:null",
    "eq:airline_code:VN",
    "eq:flight_number:VN123",
    "eq:stops:0",
  ]);

  // UNKNOWN stops
  const q3 = applyObservedScope(new Capture(), { opportunity_id: "opportunity:HAN:SGN:2026-11-01::VN:VN123:UNKNOWN" });
  assertEquals(q3.calls, [
    "eq:origin_code:HAN",
    "eq:destination_code:SGN",
    "eq:depart_date:2026-11-01",
    "is:return_date:null",
    "eq:airline_code:VN",
    "eq:flight_number:VN123",
    "is:stops:null",
  ]);
});

Deno.test("D4: typed ID namespaces distinguish observation UUIDs, dedupe keys, and opportunities", () => {
  // Pure UUID -> observation_id
  const uuid = "c8b5774a-25c7-43cf-8a03-7cb7d1883307";
  const qUuid = applyObservedScope(new Capture(), { id: uuid });
  assertEquals(qUuid.calls, [`eq:observation_id:${uuid}`]);

  // observation: prefix
  const qObs = applyObservedScope(new Capture(), { id: `observation:${uuid}` });
  assertEquals(qObs.calls, [`eq:observation_id:${uuid}`]);

  // dedupe: prefix
  const qDedupe = applyObservedScope(new Capture(), { id: "dedupe:gen-123:HAN:SGN:custom" });
  assertEquals(qDedupe.calls, ["eq:dedupe_key:gen-123:HAN:SGN:custom"]);

  // Generation-prefixed dedupe key (UUID:...)
  const genDedupeKey = `${uuid}:HAN:SGN:2026-11-01::VN:0:1500000`;
  const qGen = applyObservedScope(new Capture(), { id: genDedupeKey });
  assertEquals(qGen.calls, [`eq:dedupe_key:${genDedupeKey}`]);

  // 6-component legacy opportunity
  const q6 = applyObservedScope(new Capture(), { id: "legacy:HAN:SGN:2026-11-01:2026-11-05:VN:0" });
  assertEquals(q6.calls, [
    "eq:origin_code:HAN",
    "eq:destination_code:SGN",
    "eq:depart_date:2026-11-01",
    "eq:return_date:2026-11-05",
    "eq:airline_code:VN",
    "eq:stops:0",
  ]);

  // Invalid stops in opportunity ID fails closed
  assertThrows(() => applyObservedScope(new Capture(), { id: "HAN:SGN:2026-11-01::VN:VN123:INVALID" }), RangeError);
});

