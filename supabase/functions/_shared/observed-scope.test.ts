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
  assert(!src.includes("const latestQuery = service\n      .from"));
  assert(!src.includes("row.stops ?? 0"));
});
