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

test("deploy workflow dispatch inputs define strict environment choices, concurrency, and validation benchmark", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  // Inputs definition contract
  assert.match(workflow, /workflow_dispatch:/, "deploy workflow must be triggered by workflow_dispatch");
  assert.match(workflow, /type: choice/, "target_environment must be a choice input");
  assert.match(workflow, /options:\s*\n\s*- Preview\s*\n\s*- Production/, "target_environment options must strictly be Preview and Production");
  assert.match(workflow, /type: string/, "production_confirmation must be a string input");

  // Concurrency contract
  assert.match(workflow, /group: supabase-runtime-deploy-\$\{\{ inputs\.target_environment \}\}/, "concurrency group must isolate environment deploys");
  assert.match(workflow, /cancel-in-progress: false/, "deploy concurrency must not cancel in-progress deploys");

  // Micro-benchmark: 10,000 deployment boundary checks under 50ms
  const start = performance.now();
  for (let i = 0; i < 10_000; i++) {
    const isTargetSafe = workflow.includes("default: Preview") && workflow.includes("DEPLOY_PRODUCTION");
    assert.equal(isTargetSafe, true);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 50, `10,000 deploy boundary checks took ${duration.toFixed(2)}ms, expected < 50ms`);
});
