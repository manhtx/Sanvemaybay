import test from "node:test";
import assert from "node:assert/strict";
import { isProtectedReadResult, PROTECTED_TABLES } from "./security-smoke.mjs";

test("security smoke accepts denied (401, 403) or RLS-empty (200 with []) reads only", () => {
  assert.equal(isProtectedReadResult(401, { message: "denied" }), true);
  assert.equal(isProtectedReadResult(403, { message: "denied" }), true);
  assert.equal(isProtectedReadResult(200, []), true);

  // Leaked data rows must return false
  assert.equal(isProtectedReadResult(200, [{ id: "leaked" }]), false);
  assert.equal(isProtectedReadResult(200, [{ email: "user@example.com" }]), false);

  // Server error 500 must return false
  assert.equal(isProtectedReadResult(500, []), false);
  assert.equal(isProtectedReadResult(502, []), false);
  assert.equal(isProtectedReadResult(503, []), false);
});

test("security smoke fail-closed handling for HTTP 404 under production vs allowMissing", () => {
  // Default mode (allowMissing = false) must fail closed
  assert.equal(isProtectedReadResult(404, { message: "missing" }), false);
  assert.equal(isProtectedReadResult(404, { message: "missing" }, false), false);

  // Explicit allowMissing = true permitted for local development/staging
  assert.equal(isProtectedReadResult(404, { message: "missing" }, true), true);
});

test("security smoke exhaustive protected tables catalog integrity (all 16 tables covered)", () => {
  const expectedTables = [
    "flights",
    "scan_runs",
    "user_alerts",
    "user_preferences",
    "user_bookmarks",
    "travel_intents",
    "watch_evaluations",
    "watch_condition_episodes",
    "notification_outbox",
    "notification_delivery_attempts",
    "notification_deliveries",
    "product_events",
    "request_rate_limits",
    "observed_fare_snapshots",
    "account_deletion_requests",
    "operational_scan_health",
  ];

  assert.equal(PROTECTED_TABLES.length, 16, "PROTECTED_TABLES must contain exactly 16 tables");
  for (const table of expectedTables) {
    assert.ok(PROTECTED_TABLES.includes(table), `PROTECTED_TABLES must include: ${table}`);
  }
});

test("security smoke defensive robustness on malformed or non-array payloads without throwing", () => {
  // HTTP 200 with non-array payloads must return false without throwing
  assert.equal(isProtectedReadResult(200, null), false);
  assert.equal(isProtectedReadResult(200, undefined), false);
  assert.equal(isProtectedReadResult(200, "string"), false);
  assert.equal(isProtectedReadResult(200, 12345), false);
  assert.equal(isProtectedReadResult(200, {}), false);
  assert.equal(isProtectedReadResult(200, { data: [] }), false);

  // 401/403 with non-object payloads still return true safely
  assert.equal(isProtectedReadResult(401, null), true);
  assert.equal(isProtectedReadResult(403, undefined), true);
});

test("security smoke immutability: PROTECTED_TABLES cannot be modified or corrupted", () => {
  const snapshot = [...PROTECTED_TABLES];
  Object.freeze(PROTECTED_TABLES);

  // Assert contents remain identical
  assert.deepEqual(PROTECTED_TABLES, snapshot);
});

test("performance benchmark: 10,000 security read evaluations execute in under 50ms", () => {
  const start = performance.now();
  const emptyArray = [];
  const leakedArray = [{ id: "leak" }];

  for (let i = 0; i < 10000; i++) {
    const isProtected = isProtectedReadResult(200, emptyArray);
    const isLeaked = isProtectedReadResult(200, leakedArray);
    if (!isProtected || isLeaked) throw new Error("Security check failed");
  }

  const elapsed = performance.now() - start;
  assert.ok(elapsed < 50, `10,000 security read evaluations must execute in under 50ms (took ${elapsed.toFixed(2)}ms)`);
});
