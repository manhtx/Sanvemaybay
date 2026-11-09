import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("CI replays and lints the full migration chain in an isolated database", async () => {
  const workflow = await readFile(ciWorkflowUrl, "utf8");
  assert.match(workflow, /clean-database-bootstrap:/, "ci.yml must define clean-database-bootstrap job");
  assert.match(workflow, /version: 2\.115\.0/, "ci.yml must pin Supabase CLI 2.115.0");
  assert.match(workflow, /supabase start -x gotrue,realtime,storage-api/, "ci.yml must start headless PostgreSQL");
  assert.match(workflow, /supabase db reset --local/, "ci.yml must replay migration chain from scratch");
  assert.match(workflow, /supabase db lint --local --schema public --level warning --fail-on error/, "ci.yml must lint public schema strictly");
  assert.match(workflow, /if: always\(\)[\s\S]*supabase stop --no-backup/, "ci.yml must clean up containers on always()");
});

test("CI check job enforces PostgreSQL 16 container health and port binding", async () => {
  const workflow = await readFile(ciWorkflowUrl, "utf8");
  assert.match(workflow, /image: postgres:16/, "ci.yml check job must use postgres:16 image");
  assert.match(workflow, /- 5432:5432/, "ci.yml check job must bind port 5432");
  assert.match(workflow, /--health-cmd pg_isready/, "ci.yml check job must specify pg_isready health command");
  assert.match(workflow, /--health-interval 10s/, "ci.yml check job must check health at 10s interval");
  assert.match(workflow, /--health-retries 5/, "ci.yml check job must allow 5 retries");
});

test("CI check job enforces high-severity npm audit and multi-tier verification", async () => {
  const workflow = await readFile(ciWorkflowUrl, "utf8");
  assert.match(workflow, /npm audit --audit-level=high/, "ci.yml must fail on high-severity security vulnerabilities");
  assert.match(workflow, /npm run check/, "ci.yml must run check (typecheck, lint, test, build)");
  assert.match(workflow, /npm run check:functions/, "ci.yml must verify Edge functions typing");
  assert.match(workflow, /npm run test:functions/, "ci.yml must run Edge functions tests");
  assert.match(workflow, /npm run test:e2e/, "ci.yml must run Playwright E2E tests");
});

test("CI check job isolates client public credentials and excludes service role secrets", async () => {
  const workflow = await readFile(ciWorkflowUrl, "utf8");
  // Public variables required for frontend E2E mocks
  assert.match(workflow, /VITE_SUPABASE_URL: \$\{\{ secrets\.VITE_SUPABASE_URL \}\}/, "ci.yml must pass public client URL");
  assert.match(workflow, /VITE_SUPABASE_ANON_KEY: \$\{\{ secrets\.VITE_SUPABASE_ANON_KEY \}\}/, "ci.yml must pass public anon key");

  // Privileged credentials must NOT be in the client check job environment
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY/, "ci.yml check job must never expose service role key");
  assert.doesNotMatch(workflow, /INTERNAL_FUNCTION_SECRET/, "ci.yml check job must never expose internal function secret");
});

test("CI concurrency configuration cancels in-progress verification on branch updates", async () => {
  const workflow = await readFile(ciWorkflowUrl, "utf8");
  assert.match(workflow, /concurrency:\s*\n\s*group: verify-\$\{\{ github\.workflow \}\}-\$\{\{ github\.ref \}\}/, "ci.yml must group concurrency by ref");
  assert.match(workflow, /cancel-in-progress: true/, "ci.yml must cancel redundant in-flight runs");
});
