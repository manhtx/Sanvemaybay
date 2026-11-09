import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFunctionParity, remoteFunctionNames, parseFunctionText, localFunctionNames } from "./function-parity.mjs";

test("function parity accepts a clean runtime and local pending deployments", () => {
  assert.equal(evaluateFunctionParity(["feed", "search"], []).ok, true);
  const result = evaluateFunctionParity(["feed", "search"], ["feed"]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.pending_deploy, ["search"]);
});

test("function parity fails closed for remote-only source drift", () => {
  const result = evaluateFunctionParity(["feed"], ["archive-import", "feed"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.remote_only_functions, ["archive-import"]);
});

test("function parser rejects malformed slugs", () => {
  assert.deepEqual(remoteFunctionNames({ functions: [
    { slug: "observed-fares" },
    { slug: "../../unsafe" },
    { name: "missing-slug" },
  ] }), ["observed-fares"]);
});

test("function parser parses array and ASCII table correctly", () => {
  const arr = remoteFunctionNames([{ slug: "feed-snapshot" }, { slug: "flight-search" }]);
  assert.deepEqual(arr, ["feed-snapshot", "flight-search"]);

  const table = `
   NAME           | SLUG          | STATUS  | UPDATED_AT
------------------+---------------+---------+-----------------------
   feed-snapshot  | feed-snapshot | ACTIVE  | 2026-01-01T00:00:00Z
   flight-search  | flight-search | ACTIVE  | 2026-01-01T00:00:00Z
`;
  const parsed = parseFunctionText(table);
  assert.deepEqual(parsed, ["feed-snapshot", "flight-search"]);
});

test("localFunctionNames discovers exactly all 14 active edge functions in the repository", () => {
  const localFunctions = localFunctionNames();
  assert.equal(localFunctions.length, 14, "Expected exactly 14 local Edge Functions");
  const expected = [
    "ai-explainer",
    "alert-processor",
    "analyze-price",
    "deal-redirect",
    "feed-snapshot",
    "flight-ingest",
    "flight-search",
    "manage-alert",
    "manage-user-data",
    "observed-fares",
    "refresh-observed-fares",
    "retention-cleanup",
    "setup-alert",
    "track-event",
  ];
  assert.deepEqual(localFunctions, expected);
});

test("function parity performance benchmark: 5,000 parity evaluations execute under latency budget", () => {
  const local = localFunctionNames();
  const remote = [...local, "test-drift"];
  const start = performance.now();
  const iterations = 5000;

  for (let i = 0; i < iterations; i++) {
    const res = evaluateFunctionParity(local, remote);
    assert.equal(res.ok, false);
    assert.deepEqual(res.remote_only_functions, ["test-drift"]);
  }

  const duration = performance.now() - start;
  // 5,000 comparisons should finish well within 100ms
  assert.ok(duration < 100, `Benchmark took ${duration.toFixed(2)}ms, expected < 100ms`);
});
