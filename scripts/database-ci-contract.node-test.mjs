import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

test("CI replays and lints the full migration chain in an isolated database", async () => {
  const workflow = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  assert.match(workflow, /clean-database-bootstrap:/);
  assert.match(workflow, /version: 2\.115\.0/);
  assert.match(workflow, /supabase db reset --local/);
  assert.match(workflow, /supabase db lint --local --schema public --level warning --fail-on error/);
  assert.match(workflow, /if: always\(\)[\s\S]*supabase stop --no-backup/);
});
