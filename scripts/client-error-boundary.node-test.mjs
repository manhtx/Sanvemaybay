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
