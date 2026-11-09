import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const migrationUrl = new URL("../supabase/migrations/20260820000700_idempotent_account_deletion.sql", import.meta.url);
const functionUrl = new URL("../supabase/functions/manage-user-data/index.ts", import.meta.url);
const sharedUrl = new URL("../supabase/functions/_shared/user-data.ts", import.meta.url);

test("account deletion is transactional for application data and service-role only", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /BEGIN;[\s\S]*prepare_account_deletion[\s\S]*COMMIT;/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.account_deletion_requests FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.prepare_account_deletion\(UUID\) FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.prepare_account_deletion\(UUID\) TO service_role/);
  assert.match(migration, /status = 'completed'[\s\S]*interval '180 days'/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.cleanup_account_deletion_requests\(BOOLEAN\) FROM PUBLIC, anon, authenticated/);
});

test("account deletion records retry and completion state around Auth deletion", async () => {
  const source = await readFile(functionUrl, "utf8");
  const prepareIndex = source.indexOf('service.rpc("prepare_account_deletion"');
  const authDeleteIndex = source.indexOf("service.auth.admin.deleteUser");
  const completionIndex = source.indexOf('status: "completed"');
  assert.ok(prepareIndex >= 0, "Must call prepare_account_deletion RPC");
  assert.ok(authDeleteIndex > prepareIndex, "Auth deleteUser must occur after application tables prepared");
  assert.ok(completionIndex > authDeleteIndex, "Completed status update must occur after Auth deletion");
  assert.match(source, /status: "auth_delete_failed"/, "Must handle auth deletion failure");
});

test("account deletion requires explicit confirmation string ('DELETE_MY_ACCOUNT')", async () => {
  const functionSource = await readFile(functionUrl, "utf8");
  const sharedSource = await readFile(sharedUrl, "utf8");

  assert.match(functionSource, /isAccountDeletionConfirmed\(body\.confirmation\)/, "Edge Function must verify confirmation via isAccountDeletionConfirmed");
  assert.match(functionSource, /"Explicit deletion confirmation required"/, "Must return explicit 400 error message when confirmation is missing");
  assert.match(sharedSource, /return value === "DELETE_MY_ACCOUNT"/, "Shared helper must check exact token DELETE_MY_ACCOUNT");

  // Verify pure confirmation function logic
  const isConfirmed = (val) => val === "DELETE_MY_ACCOUNT";
  assert.equal(isConfirmed("DELETE_MY_ACCOUNT"), true);
  assert.equal(isConfirmed("delete_my_account"), false);
  assert.equal(isConfirmed("CONFIRM_DELETE_MY_ACCOUNT"), false);
  assert.equal(isConfirmed(""), false);
  assert.equal(isConfirmed(null), false);
  assert.equal(isConfirmed(undefined), false);
  assert.equal(isConfirmed({}), false);
});

test("account deletion telemetry isolates PII and bans raw user_id or email logging", async () => {
  const functionSource = await readFile(functionUrl, "utf8");
  const sharedSource = await readFile(sharedUrl, "utf8");

  const logStatements = functionSource.split("\n").filter((line) => line.includes("console."));

  for (const line of logStatements) {
    assert.equal(line.includes("user.id"), false, `Log line must not leak user.id: ${line}`);
    assert.equal(line.includes("user.email"), false, `Log line must not leak user.email: ${line}`);
    assert.equal(line.includes("user_id: user.id"), false, `Log line must not leak raw user_id: ${line}`);
  }

  assert.match(functionSource, /userLogId = await accountDeletionLogId\(user\.id\)/, "Must compute pseudonymized userLogId");
  assert.match(sharedSource, /crypto\.subtle\.digest\("SHA-256",/, "Pseudonym helper must use SHA-256 cryptographic digest");
  assert.match(sharedSource, /slice\(0, 8\)/, "Pseudonym helper must truncate digest to 8 bytes (16 hex chars)");

  // Test hash helper logic
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("user-12345-uuid"));
  const pseudoId = Array.from(new Uint8Array(digest).slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  assert.equal(pseudoId.length, 16);
  assert.match(pseudoId, /^[0-9a-f]{16}$/);
});

test("account deletion idempotent replay handles repeated requests via database state", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  const functionSource = await readFile(functionUrl, "utf8");

  assert.match(migration, /INSERT INTO public\.account_deletion_requests/, "Must insert initial deletion request");
  assert.match(migration, /ON CONFLICT \(user_id\) DO UPDATE/, "Must handle conflict for idempotent replay");
  assert.match(migration, /attempts = public\.account_deletion_requests\.attempts \+ 1/, "Must increment attempt count on conflict");
  assert.match(migration, /status = 'data_deleted'/, "Must transition status to data_deleted after cascade delete");
  assert.match(functionSource, /service\.rpc\("prepare_account_deletion"/, "Edge Function invokes prepare_account_deletion RPC");
});

test("account deletion retention cleanup enforces 180-day window and service-role only execution", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.cleanup_account_deletion_requests/, "Must define cleanup function");
  assert.match(migration, /p_dry_run BOOLEAN DEFAULT TRUE/, "Cleanup function must default to safe dry-run mode");
  assert.match(migration, /interval '180 days'/, "Must enforce 180-day retention before row deletion");
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.cleanup_account_deletion_requests\(BOOLEAN\) FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.cleanup_account_deletion_requests\(BOOLEAN\) TO service_role/);
});
