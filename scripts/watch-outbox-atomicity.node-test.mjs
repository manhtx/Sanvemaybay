import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("NODE WATCH-05 & OUTBOX-01: migration defines single open episode constraint and atomic RPC", () => {
  const migrationPath = path.resolve("supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql");
  assert.ok(fs.existsSync(migrationPath), "Migration 20261007000300 must exist");

  const sql = fs.readFileSync(migrationPath, "utf8");

  // NODE WATCH-05: Single open episode partial unique index
  assert.ok(
    sql.includes("idx_watch_condition_episodes_single_open"),
    "Must create partial unique index idx_watch_condition_episodes_single_open"
  );
  assert.ok(
    sql.includes("WHERE closed_at IS NULL"),
    "Must enforce single open episode constraint with WHERE closed_at IS NULL"
  );

  // NODE OUTBOX-01: apply_watch_evaluation RPC
  assert.ok(
    sql.includes("CREATE OR REPLACE FUNCTION public.apply_watch_evaluation"),
    "Must create apply_watch_evaluation RPC"
  );
  assert.ok(
    sql.includes("UPDATE public.user_alerts"),
    "apply_watch_evaluation must update user_alerts tracking columns"
  );
  assert.ok(
    sql.includes("public.watch_condition_episodes"),
    "apply_watch_evaluation must manage watch_condition_episodes"
  );
  assert.ok(
    sql.includes("INSERT INTO public.watch_evaluations"),
    "apply_watch_evaluation must insert watch_evaluations row"
  );
  assert.ok(
    sql.includes("INSERT INTO public.notification_outbox"),
    "apply_watch_evaluation must insert into notification_outbox"
  );
  assert.ok(
    sql.includes("ON CONFLICT (dedupe_key) DO NOTHING"),
    "Outbox insertion must respect dedupe_key uniqueness"
  );
});

test("NODE OUTBOX-03: migration defines atomic queue claim with FOR UPDATE SKIP LOCKED", () => {
  const migrationPath = path.resolve("supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  assert.ok(
    sql.includes("CREATE OR REPLACE FUNCTION public.claim_notification_outbox"),
    "Must define claim_notification_outbox RPC"
  );
  assert.ok(
    sql.includes("FOR UPDATE SKIP LOCKED"),
    "Must use FOR UPDATE SKIP LOCKED for atomic claim"
  );
  assert.ok(
    sql.includes("SET status = 'PROCESSING'"),
    "Must atomically transition claimed rows to PROCESSING"
  );
  assert.ok(
    sql.includes("attempt_count = no.attempt_count + 1"),
    "Must atomically increment attempt_count on claim"
  );
  assert.ok(
    sql.includes("GRANT EXECUTE ON FUNCTION public.claim_notification_outbox TO service_role"),
    "Must grant execute permission to service_role"
  );
});

test("NODE OUTBOX-02: alert-processor decouples evaluation from dispatch with zero synchronous external calls", () => {
  const processorPath = path.resolve("supabase/functions/alert-processor/index.ts");
  const code = fs.readFileSync(processorPath, "utf8");

  // Step 1: Evaluation calls apply_watch_evaluation RPC
  assert.ok(
    code.includes('supabase.rpc("apply_watch_evaluation"'),
    "Evaluation step must use apply_watch_evaluation RPC"
  );

  // Step 2: Dispatcher calls claim_notification_outbox RPC
  assert.ok(
    code.includes('supabase.rpc("claim_notification_outbox"'),
    "Dispatcher step must use claim_notification_outbox RPC"
  );

  // Verify separation: evaluation loop does NOT call sendEmail or sendTelegram directly
  const step1Index = code.indexOf("// STEP 1:");
  const step2Index = code.indexOf("// STEP 2:");
  assert.ok(step1Index > 0 && step2Index > step1Index, "Step 1 and Step 2 must be sequentially ordered");

  const step1Slice = code.slice(step1Index, step2Index);
  assert.ok(!step1Slice.includes("sendEmail"), "Step 1 evaluation must NOT invoke sendEmail");
  assert.ok(!step1Slice.includes("sendTelegram"), "Step 1 evaluation must NOT invoke sendTelegram");

  const step2Slice = code.slice(step2Index);
  assert.ok(step2Slice.includes("sendEmail"), "Step 2 dispatcher must handle sendEmail");
  assert.ok(step2Slice.includes("sendTelegram"), "Step 2 dispatcher must handle sendTelegram");
});

test("NODE OUTBOX-04: Outbox dispatch enforces bounded retries and dead lettering (REQ-NOTIF-004)", () => {
  const processorPath = path.resolve("supabase/functions/alert-processor/index.ts");
  const code = fs.readFileSync(processorPath, "utf8");

  assert.ok(
    code.includes('status: "PERMANENT_FAILED"'),
    "Must transition to PERMANENT_FAILED after max retry attempts"
  );
  assert.ok(
    code.includes('status: "RETRYABLE_FAILED"'),
    "Must transition to RETRYABLE_FAILED on transient failures"
  );
  assert.ok(
    code.includes("nextNotificationRetry"),
    "Must use nextNotificationRetry for bounded exponential/step backoff"
  );
});
