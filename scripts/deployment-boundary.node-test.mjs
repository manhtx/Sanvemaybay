import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const workflowUrl = new URL("../.github/workflows/deploy-supabase-ingest.yml", import.meta.url);

test("runtime deployment defaults to Preview and binds an explicit environment", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /default: Preview/, "deploy workflow must default target_environment to Preview");
  assert.match(workflow, /environment: \$\{\{ inputs\.target_environment \}\}/, "deploy workflow must bind environment to input");
});

test("production runtime deployment requires main and an exact confirmation", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /test "\$SOURCE_REF" = "refs\/heads\/main"/, "production deploy must enforce main branch");
  assert.match(workflow, /test "\$PRODUCTION_CONFIRMATION" = "DEPLOY_PRODUCTION"/, "production deploy must enforce exact confirmation");
  assert.match(workflow, /migration-parity\.mjs/, "deploy workflow must check migration parity before mutating");
  assert.match(workflow, /function-parity\.mjs/, "deploy workflow must check function parity before mutating");
});

test("runtime deployment validates expected project ref against repository variable", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /EXPECTED_SUPABASE_PROJECT_REF: \$\{\{ vars\.EXPECTED_SUPABASE_PROJECT_REF \}\}/, "deploy workflow must read EXPECTED_SUPABASE_PROJECT_REF variable");
  assert.match(workflow, /test "\$SUPABASE_PROJECT_REF" = "\$EXPECTED_SUPABASE_PROJECT_REF"/, "deploy workflow must fail closed on project ref mismatch");
});

test("runtime deployment executes public runtime smoke tests for feed-snapshot and flight-search", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /curl -sS -o \/tmp\/feed-response\.json -w '%\{http_code\}'/, "deploy workflow must smoke test feed-snapshot");
  assert.match(workflow, /grep -q '"deals"' \/tmp\/feed-response\.json/, "deploy workflow must verify deals in feed response");
  assert.match(workflow, /curl -sS -o \/tmp\/search-response\.json -w '%\{http_code\}'/, "deploy workflow must smoke test flight-search");
  assert.match(workflow, /case "\$search_status" in\s*\n\s*200\|429\|503\)/, "deploy workflow must accept expected flight-search status codes");
});

test("runtime deployment persists immutable release evidence artifacts with 90-day retention", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /node scripts\/release-manifest\.mjs > release-manifest\.json/, "deploy workflow must generate release manifest");
  assert.match(workflow, /uses: actions\/upload-artifact@v4/, "deploy workflow must upload artifacts");
  assert.match(workflow, /release-manifest\.json/, "deploy artifacts must include release-manifest.json");
  assert.match(workflow, /remote-migrations\.json/, "deploy artifacts must include remote-migrations.json");
  assert.match(workflow, /remote-functions\.json/, "deploy artifacts must include remote-functions.json");
  assert.match(workflow, /retention-days: 90/, "deploy artifacts must specify 90-day retention");
  assert.match(workflow, /if-no-files-found: error/, "deploy artifacts must fail closed on missing evidence");
});

test("deploy workflow enforces least-privilege permissions ('contents: read') and protects access token credentials", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/, "deploy workflow must enforce least-privilege contents: read");
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/, "deploy workflow must scope SUPABASE_ACCESS_TOKEN from secrets");
  assert.match(workflow, /test -n "\$SUPABASE_ACCESS_TOKEN"/, "deploy workflow must validate token presence before execution");
  assert.doesNotMatch(workflow, /echo .*SUPABASE_ACCESS_TOKEN/, "deploy workflow must never echo access tokens");
  assert.doesNotMatch(workflow, /echo .*INTERNAL_FUNCTION_SECRET/, "deploy workflow must never echo internal secrets");
});
