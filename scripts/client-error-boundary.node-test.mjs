import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const browserBoundaryFiles = [
  "src/app/data/api.ts",
  "src/app/data/alertApi.ts",
  "src/app/data/routeApi.ts",
  "src/app/lib/analytics.ts",
  "src/app/lib/supabase.ts",
  "src/app/pages/AlertsPage.tsx",
  "src/app/pages/DealDetailPage.tsx",
];

test("browser service boundaries never log caught provider or database errors", async () => {
  for (const file of browserBoundaryFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /console\.(?:error|warn|log|debug)\s*\(/, file);
    assert.doesNotMatch(source, /new Error\s*\(\s*(?:error\.message|data\?\.error)/, file);
  }
});

test("touched public Edge Functions never return raw database error messages", async () => {
  for (const file of [
    "supabase/functions/setup-alert/index.ts",
    "supabase/functions/manage-alert/index.ts",
    "supabase/functions/ai-explainer/index.ts",
  ]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /json\(\{\s*error:\s*(?:routeError|dbError|updateError)\.message/, file);
    assert.doesNotMatch(source, /err instanceof Error \? err\.message/, file);
  }
});

test("internal mutation and worker functions reject non-POST methods before auth", async () => {
  for (const file of [
    "supabase/functions/ai-explainer/index.ts",
    "supabase/functions/alert-processor/index.ts",
    "supabase/functions/analyze-price/index.ts",
    "supabase/functions/flight-ingest/index.ts",
    "supabase/functions/refresh-observed-fares/index.ts",
    "supabase/functions/retention-cleanup/index.ts",
  ]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    const serveBoundary = source.indexOf("Deno.serve");
    const methodGuard = source.indexOf('method !== "POST"', serveBoundary);
    const authGuard = source.indexOf("requireInternalSecret(", serveBoundary);
    assert.notEqual(methodGuard, -1, `${file}: missing POST-only guard`);
    assert.notEqual(authGuard, -1, `${file}: missing internal auth guard`);
    assert.ok(methodGuard < authGuard, `${file}: method guard must precede auth and body work`);
  }
});

test("analytics metadata whitelist strictly isolates PII and bans sensitive user fields", async () => {
  const source = await readFile(new URL("../src/app/lib/analytics.ts", import.meta.url), "utf8");

  // Verify allowedMetadata definition exists and is a Set
  assert.match(source, /const allowedMetadata = new Set\(\[/, "analytics.ts must define strict allowedMetadata Set");

  // Verify prohibited sensitive/PII fields are completely absent from allowedMetadata
  const piiFields = ["email", "phone", "password", "token", "secret", "user_id", "credit_card", "ssn", "name", "address"];
  for (const field of piiFields) {
    const fieldPattern = new RegExp(`"${field}"`);
    assert.doesNotMatch(source, fieldPattern, `analytics allowedMetadata must not contain PII field: ${field}`);
  }

  // Verify sanitizeProductEvent filters both allowed keys and primitive types
  assert.match(source, /allowedMetadata\.has\(key\)/, "sanitizeProductEvent must check allowedMetadata.has(key)");
  assert.match(source, /typeof value === "string" \|\| typeof value === "number"/, "sanitizeProductEvent must validate primitive value types");
});

test("client diagnostic reporting pattern validates low-cardinality regex and quarantines freeform strings", async () => {
  const source = await readFile(new URL("../src/app/lib/clientDiagnostics.ts", import.meta.url), "utf8");

  // Verify CLIENT_ISSUE_PATTERN regex
  assert.match(source, /const CLIENT_ISSUE_PATTERN = \/\^\[a-z\]\[a-z0-9_\]\{2,63\}\$\/;/, "clientDiagnostics must enforce bounded snake_case token regex");

  // Test regex directly against valid and malicious patterns
  const CLIENT_ISSUE_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;

  assert.ok(CLIENT_ISSUE_PATTERN.test("alert_create_failed"), "valid issue code passes");
  assert.ok(CLIENT_ISSUE_PATTERN.test("product_analytics_unavailable"), "valid issue code passes");
  assert.ok(CLIENT_ISSUE_PATTERN.test("tracked_routes_unavailable"), "valid issue code passes");

  // Malicious or freeform strings must fail pattern
  assert.ok(!CLIENT_ISSUE_PATTERN.test("SELECT * FROM users"), "SQL injection payload fails pattern");
  assert.ok(!CLIENT_ISSUE_PATTERN.test("user@example.com"), "email address fails pattern");
  assert.ok(!CLIENT_ISSUE_PATTERN.test("Alert Failed!"), "spaces and symbols fail pattern");
  assert.ok(!CLIENT_ISSUE_PATTERN.test("a"), "too short token (<3 chars) fails pattern");
  assert.ok(!CLIENT_ISSUE_PATTERN.test("A_CAPITAL_CODE"), "uppercase fails pattern");
});

test("client data layer endpoints ensure fail-closed safe fallbacks on transport or service failure", async () => {
  const alertApiSource = await readFile(new URL("../src/app/data/alertApi.ts", import.meta.url), "utf8");
  const routeApiSource = await readFile(new URL("../src/app/data/routeApi.ts", import.meta.url), "utf8");

  // alertApi.ts must check isSupabaseConfigured before network calls
  assert.match(alertApiSource, /if \(!isSupabaseConfigured\)/, "alertApi must verify Supabase configuration before dispatch");
  // alertApi.ts must throw PublicClientError on error rather than raw objects
  assert.match(alertApiSource, /throw new PublicClientError\(/, "alertApi must wrap failures in PublicClientError");

  // routeApi.ts must return empty array fallback on missing configuration or transport error
  assert.match(routeApiSource, /if \(!isSupabaseConfigured\) return \[\];/, "routeApi must return empty array if unconfigured");
  assert.match(routeApiSource, /if \(error\) \{\s*reportClientIssue\("tracked_routes_unavailable"\);\s*return \[\];\s*\}/, "routeApi must return safe empty array fallback on error");
});
