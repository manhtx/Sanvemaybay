import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PROTECTED_TABLES } from "./security-smoke.mjs";

function getPgTapContent() {
  const pgtapPath = path.resolve("supabase/tests/database/01_rls_tenant_isolation.sql");
  assert.ok(fs.existsSync(pgtapPath), "pgTAP test matrix 01_rls_tenant_isolation.sql must exist");
  return fs.readFileSync(pgtapPath, "utf8");
}

function getAllMigrationsContent() {
  const migrationsDir = path.resolve("supabase/migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  return files.map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8")).join("\n");
}

test("RLS tenant isolation test suite covers all private tables (REQ-SEC-002, NC-025..NC-029)", () => {
  const sqlContent = getPgTapContent();

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
      `pgTAP test must explicitly test table: ${table}`
    );
    assert.ok(
      PROTECTED_TABLES.includes(table),
      `PROTECTED_TABLES must include: ${table}`
    );
  }
});

test("RLS tenant isolation: pgTAP enforces NC-025 (cross-tenant SELECT isolation between User A and User B)", () => {
  const sql = getPgTapContent();
  assert.ok(sql.includes("SET LOCAL ROLE authenticated"), "Must test under authenticated role");
  assert.ok(sql.includes("SET LOCAL \"request.jwt.claim.sub\""), "Must set JWT claim for User A");
  assert.ok(
    sql.includes("SELECT is_empty(\n  'SELECT id FROM public.user_alerts WHERE user_id = ''22222222-2222-4222-b222-222222222222''::uuid'") ||
    sql.includes("NC-025: User A cannot SELECT alerts belonging to User B"),
    "Must verify User A cannot read User B alerts"
  );
  assert.ok(
    sql.includes("NC-025: User A cannot SELECT travel intents belonging to User B"),
    "Must verify User A cannot read User B travel intents"
  );
});

test("RLS tenant isolation: pgTAP enforces NC-026 (cross-tenant INSERT forgery rejection with throws_ok)", () => {
  const sql = getPgTapContent();
  assert.ok(sql.includes("insert_forged_alert"), "Must define prepared statement for forged alert insert");
  assert.ok(sql.includes("insert_forged_intent"), "Must define prepared statement for forged intent insert");
  assert.ok(
    sql.includes("NC-026: User A cannot INSERT alert forged with user_id of User B"),
    "Must test throws_ok on forged alert insert"
  );
  assert.ok(
    sql.includes("NC-026: User A cannot INSERT travel intent forged with user_id of User B"),
    "Must test throws_ok on forged intent insert"
  );
});

test("RLS tenant isolation: pgTAP enforces NC-027 and NC-028 (cross-tenant UPDATE and DELETE rejection)", () => {
  const sql = getPgTapContent();
  // NC-027: UPDATE does not mutate User B row
  assert.ok(
    sql.includes("UPDATE public.user_alerts\nSET budget = 1000000"),
    "Must attempt unauthorized UPDATE"
  );
  assert.ok(
    sql.includes("NC-027: User A update on User B alert must have zero effect"),
    "Must assert row values unmodified"
  );

  // NC-028: DELETE does not delete User B row
  assert.ok(
    sql.includes("DELETE FROM public.user_alerts"),
    "Must attempt unauthorized DELETE"
  );
  assert.ok(
    sql.includes("NC-028: User A delete on User B alert must have zero effect"),
    "Must assert row still exists after delete attempt"
  );
});

test("RLS tenant isolation: pgTAP enforces NC-029 (anonymous role enumeration prevention on travel_intents)", () => {
  const sql = getPgTapContent();
  assert.ok(sql.includes("SET LOCAL ROLE anon;"), "Must test under anon role");
  assert.ok(
    sql.includes("NC-029: Anonymous users cannot SELECT from private travel_intents"),
    "Must assert anonymous SELECT yields empty results"
  );
});

test("RLS tenant isolation: all 16 PROTECTED_TABLES are protected by RLS or privileged service-role grants", () => {
  const allSql = getAllMigrationsContent();
  assert.equal(PROTECTED_TABLES.length, 16, "PROTECTED_TABLES must have exactly 16 tables");

  for (const table of PROTECTED_TABLES) {
    if (table === "operational_scan_health") {
      // operational_scan_health is a privileged view with REVOKE ALL and service_role grant
      assert.ok(
        allSql.includes("REVOKE ALL ON TABLE public.operational_scan_health FROM PUBLIC, anon, authenticated"),
        "operational_scan_health view must revoke all access from public, anon, and authenticated"
      );
    } else {
      // All other tables must have explicit ENABLE ROW LEVEL SECURITY
      const hasRls = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i").test(allSql);
      assert.ok(
        hasRls,
        `Table "${table}" must have ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY in migrations`
      );
    }
  }
});
