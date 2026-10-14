/**
 * RPC Security Role & Worker Access Enforcement
 * S01, C-10, A06: Privileged SECURITY DEFINER RPCs must deny execution to unauthorized roles (anon / public).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://yefbpmqfsstcaeqfrmyn.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmJwbXFmc3N0Y2FlcWZybXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mzk2MjQsImV4cCI6MjEwNjIxNTYyNH0.FxYMbfcX9Rg9Jj0L_D2VkX-Apzb6Iy5GqAeKlNpTRpc";

test('A06 & S01: Privileged worker RPC claim_notification_outbox denies anon execution', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_notification_outbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ p_batch_size: 1 })
  });

  // Must fail closed with 401/403/404 permission denied, NEVER 200 OK
  assert.notEqual(res.status, 200, "claim_notification_outbox must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('A06 & S01: Privileged worker RPC apply_watch_evaluation denies anon execution', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/apply_watch_evaluation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ p_watch_id: "00000000-0000-0000-0000-000000000000" })
  });

  // Must fail closed with 401/403/404 permission denied, NEVER 200 OK
  assert.notEqual(res.status, 200, "apply_watch_evaluation must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('A06 & S01: Privileged worker RPC publish_observed_generation denies anon execution', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/publish_observed_generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ p_generation_id: "00000000-0000-0000-0000-000000000000", p_row_count: 1 })
  });

  assert.notEqual(res.status, 200, "publish_observed_generation must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('A06 & S01: Privileged worker RPC prepare_account_deletion denies anon execution', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/prepare_account_deletion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ p_user_id: "00000000-0000-0000-0000-000000000000" })
  });

  assert.notEqual(res.status, 200, "prepare_account_deletion must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('A06 & S01: Privileged worker RPC rollback_observed_generation denies anon execution', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/rollback_observed_generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({})
  });

  assert.notEqual(res.status, 200, "rollback_observed_generation must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('A06 & S01: Privileged worker RPC resolve_notification_outbox denies anon execution', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_notification_outbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      p_id: "00000000-0000-0000-0000-000000000000",
      p_claim_token: "test",
      p_status: "SENT",
      p_provider_id: "test"
    })
  });

  assert.notEqual(res.status, 200, "resolve_notification_outbox must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('HT24: Privileged RPC existence is validated in database migrations separately from denial', () => {
  const migrationsDir = path.resolve("supabase/migrations");
  const sql = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .map(f => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
    .join("\n");

  const requiredRpcs = [
    'claim_notification_outbox',
    'apply_watch_evaluation',
    'publish_observed_generation',
    'rollback_observed_generation',
    'prepare_account_deletion',
    'resolve_notification_outbox',
  ];

  for (const rpc of requiredRpcs) {
    const rx = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${rpc}`, 'i');
    assert.ok(rx.test(sql), `HT24: Function ${rpc} must be defined in migrations`);
  }
});


