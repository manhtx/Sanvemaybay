import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const requiredAlertSecrets = [
  "RESEND_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "UNSUBSCRIBE_SECRET",
  "TURNSTILE_SECRET_KEY",
  "RATE_LIMIT_SALT",
];

const requiredRuntimeVariables = [
  "PUBLIC_SITE_URL",
  "ALERT_FROM_EMAIL",
  "APPROVED_BOOKING_HOSTS",
  "TURNSTILE_ALLOWED_HOSTNAMES",
];

const browserInvokedFunctions = [
  "feed-snapshot",
  "observed-fares",
  "flight-search",
  "track-event",
  "manage-user-data",
  "setup-alert",
  "manage-alert",
];

test("deploy workflow provisions every active alert and runtime dependency", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-supabase-ingest.yml", import.meta.url), "utf8");
  for (const name of requiredAlertSecrets) {
    assert.match(workflow, new RegExp(`${name}: \\$\\{\\{ secrets\\.${name} \\}\\}`), `${name}: missing environment secret binding`);
  }
  for (const name of requiredRuntimeVariables) {
    assert.match(workflow, new RegExp(`${name}: \\$\\{\\{ vars\\.${name} \\}\\}`), `${name}: missing environment variable binding`);
  }
});

test("deploy workflow enforces fail-closed non-empty assertions before setting Supabase secrets", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-supabase-ingest.yml", import.meta.url), "utf8");
  for (const name of requiredAlertSecrets) {
    assert.match(workflow, new RegExp(`test -n "\\$${name}"`), `${name}: missing fail-closed validation`);
    assert.match(workflow, new RegExp(`secrets set ${name}=`), `${name}: missing Supabase provisioning`);
  }
  for (const name of requiredRuntimeVariables) {
    assert.match(workflow, new RegExp(`test -n "\\$${name}"`), `${name}: missing fail-closed validation`);
    assert.match(workflow, new RegExp(`secrets set ${name}=`), `${name}: missing runtime provisioning`);
  }
});

test("example environment documents optional provider and bounded analyzer controls", async () => {
  const example = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(example, /^TRAVELPAYOUTS_TOKEN=/m);
  assert.match(example, /^AI_EXPLANATION_BATCH_LIMIT=20$/m);
  assert.match(example, /^ANALYZE_FLIGHT_LIMIT=300$/m);
});

test("every browser-invoked Edge Function satisfies the JSON POST preflight contract", async () => {
  for (const name of browserInvokedFunctions) {
    const source = await readFile(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), "utf8");
    assert.match(source, /method === "OPTIONS"/, `${name}: missing OPTIONS response`);
    assert.match(source, /"Access-Control-Allow-Origin": "\*"/, `${name}: missing public CORS origin`);
    assert.match(source, /"Access-Control-Allow-Methods": "POST, OPTIONS"/, `${name}: POST preflight is not explicit`);
  }
});

test("browser Edge Functions explicitly include mandatory Supabase client headers in CORS preflight", async () => {
  for (const name of browserInvokedFunctions) {
    const source = await readFile(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), "utf8");
    assert.match(source, /"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"/, `${name}: Supabase client headers are incomplete`);
  }
});

test("client Supabase configuration boundary verifies credentials and flags placeholder keys", async () => {
  const source = await readFile(new URL("../src/app/lib/supabase.ts", import.meta.url), "utf8");
  assert.match(source, /isSupabaseConfigured/, "supabase.ts must export isSupabaseConfigured flag");
  assert.match(source, /!supabaseUrl\.includes\("placeholder"\)/, "supabase.ts must reject placeholder URL");
  assert.match(source, /!supabaseAnonKey\.includes\("placeholder"\)/, "supabase.ts must reject placeholder anon key");
  assert.match(source, /reportClientIssue\("supabase_configuration_missing"\)/, "supabase.ts must report diagnostic when missing");
});
