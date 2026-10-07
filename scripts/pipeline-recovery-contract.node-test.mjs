import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

test("NODE PIPE-01 & PIPE-02: fast-flights-worker separates lifecycle status from health_status and emits typed window outcomes", async () => {
  const workerCode = await readFile(new URL("../scripts/fast-flights-worker.py", import.meta.url), "utf8");
  // scan_status must not be assigned "partial"
  assert.equal(
    workerCode.includes('scan_status = "partial"'),
    false,
    "scan_status must never be assigned 'partial' because scan_runs constraint only permits ('running', 'completed', 'failed')",
  );
  // health_status must be present in scan_body
  assert.ok(workerCode.includes('"health_status": health_status'), "health_status must be sent in scan_runs payload");
  // typed window outcomes must be collected
  assert.ok(workerCode.includes('"window_outcomes"'), "worker must collect typed window_outcomes");
  assert.ok(workerCode.includes('"PARSER_SCHEMA_DRIFT"'), "worker must classify PARSER_SCHEMA_DRIFT");
  assert.ok(workerCode.includes('"RATE_LIMITED"'), "worker must classify RATE_LIMITED");
});

test("NODE PIPE-01: migration 20261007000200 defines health_status column and updates operational_scan_health view", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261007000200_scan_runs_health_status.sql", import.meta.url),
    "utf8",
  );
  assert.ok(migration.includes("ALTER TABLE public.scan_runs"), "Migration must alter scan_runs");
  assert.ok(migration.includes("ADD COLUMN IF NOT EXISTS health_status TEXT"), "Migration must add health_status column");
  assert.ok(migration.includes("runs.health_status"), "operational_scan_health view must project health_status");
});

test("NODE PIPE-03: analyze-price enforces bounded compute envelope and bulk upserts", async () => {
  const code = await readFile(new URL("../supabase/functions/analyze-price/index.ts", import.meta.url), "utf8");
  assert.ok(code.includes("maxObservations = Math.min(500"), "analyze-price must cap max_observations at 500");
  assert.ok(code.includes("dealsToUpsert.push(deal)"), "analyze-price must collect deals for bulk upsert");
  assert.ok(code.includes(".upsert(dealsToUpsert"), "analyze-price must execute bulk upsert on deals");
  assert.ok(code.includes(".upsert(snapshotsToUpsert"), "analyze-price must execute bulk upsert on snapshots");
  assert.ok(code.includes("analyzer_run_id: runId"), "analyze-price must return analyzer_run_id telemetry");
});

test("NODE PIPE-04: orchestrate-analyzer fails closed on unexhausted source records", async () => {
  const orchestrator = await readFile(new URL("../scripts/orchestrate-analyzer.mjs", import.meta.url), "utf8");
  assert.ok(orchestrator.includes("max_observations: 300"), "orchestrator must pass bounded 300 max_observations");
  assert.ok(orchestrator.includes("process.exit(1)"), "orchestrator must exit with failure code when records remain");
  assert.equal(
    orchestrator.includes("console.warn(`Analyzer reached batch limit"),
    false,
    "orchestrator must never warn and exit cleanly on partial continuation",
  );
});

test("NODE CP-01 & CP-02: control plane evaluates proof dynamically and maintains truthful mission state", async () => {
  const generator = await readFile(
    new URL("../scripts/generate-convergence-artifacts.mjs", import.meta.url),
    "utf8",
  );
  assert.equal(
    generator.includes("const PROVEN_GATES = new Set("),
    false,
    "generate-convergence-artifacts.mjs must not contain hard-coded PROVEN_GATES set",
  );
  assert.ok(
    generator.includes("PROOF_INDEX.json"),
    "generate-convergence-artifacts.mjs must read proof dynamically from PROOF_INDEX.json",
  );

  const scorecard = JSON.parse(
    await readFile(new URL("../docs/convergence/FINAL_SCORECARD.json", import.meta.url), "utf8"),
  );
  if (scorecard.unresolved_p0 > 0) {
    assert.equal(
      scorecard.mission_state,
      "EXECUTING",
      "mission_state must be EXECUTING while unresolved_p0 is greater than zero",
    );
  }
});
