import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const migrationUrl = new URL("../supabase/migrations/20260820000700_idempotent_account_deletion.sql", import.meta.url);
const functionUrl = new URL("../supabase/functions/manage-user-data/index.ts", import.meta.url);

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
  assert.ok(prepareIndex >= 0);
  assert.ok(authDeleteIndex > prepareIndex);
  assert.ok(completionIndex > authDeleteIndex);
  assert.match(source, /status: "auth_delete_failed"/);
  const logStatements = source.split("\n").filter((line) => line.includes("console."));
  assert.equal(logStatements.some((line) => line.includes("user_id")), false);
});
