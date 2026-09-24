import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const workflowUrl = new URL("../.github/workflows/deploy-supabase-ingest.yml", import.meta.url);

test("runtime deployment defaults to Preview and binds an explicit environment", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /default: Preview/);
  assert.match(workflow, /environment: \$\{\{ inputs\.target_environment \}\}/);
  assert.match(workflow, /EXPECTED_SUPABASE_PROJECT_REF/);
  assert.match(workflow, /test "\$SUPABASE_PROJECT_REF" = "\$EXPECTED_SUPABASE_PROJECT_REF"/);
});

test("production runtime deployment requires main and an exact confirmation", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /test "\$SOURCE_REF" = "refs\/heads\/main"/);
  assert.match(workflow, /test "\$PRODUCTION_CONFIRMATION" = "DEPLOY_PRODUCTION"/);
  assert.match(workflow, /migration-parity\.mjs/);
  assert.match(workflow, /function-parity\.mjs/);
});
