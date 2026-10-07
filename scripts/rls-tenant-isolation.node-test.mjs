import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PROTECTED_TABLES } from "./security-smoke.mjs";

test("RLS tenant isolation test suite covers all private tables (REQ-SEC-002, NC-025..NC-029)", () => {
  const pgtapPath = path.resolve("supabase/tests/database/01_rls_tenant_isolation.sql");
  assert.ok(fs.existsSync(pgtapPath), "pgTAP test matrix 01_rls_tenant_isolation.sql must exist");

  const sqlContent = fs.readFileSync(pgtapPath, "utf8");

  // Negative controls validation
  assert.ok(sqlContent.includes("NC-025"), "Test must enforce NC-025 (User A cannot select User B data)");
  assert.ok(sqlContent.includes("NC-026"), "Test must enforce NC-026 (User A cannot insert owner=B)");
  assert.ok(sqlContent.includes("NC-027"), "Test must enforce NC-027 (User A cannot update User B)");
  assert.ok(sqlContent.includes("NC-028"), "Test must enforce NC-028 (User A cannot delete User B)");
  assert.ok(sqlContent.includes("NC-029"), "Test must enforce NC-029 (Anon cannot enumerate TravelIntent)");

  // Key user-owned tables
  const expectedCovered = [
    "user_alerts",
    "travel_intents",
    "user_bookmarks",
    "watch_evaluations",
    "watch_condition_episodes",
    "notification_outbox",
    "notification_delivery_attempts",
  ];

  for (const table of expectedCovered) {
    assert.ok(
      sqlContent.includes(table),
      `pgTAP test must explicitly test table: ${table}`,
    );
    assert.ok(
      PROTECTED_TABLES.includes(table),
      `PROTECTED_TABLES must include: ${table}`,
    );
  }
});
