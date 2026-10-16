import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { buildReleaseManifest, sha256 } from "./release-manifest.mjs";
import { evaluateReleaseTupleCompatibility } from "../src/domain/farely/releaseTuple.ts";

test("release manifest hashes are deterministic and exclude local secrets", () => {
  assert.equal(sha256(Buffer.from("flycheap")), sha256(Buffer.from("flycheap")));
  const manifest = buildReleaseManifest("test-sha");
  assert.equal(manifest.release_sha, "test-sha");
  assert.match(manifest.source_tree_sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.files.some((entry) => entry.file === ".env" || entry.file.includes("node_modules")), false);
  assert.equal(manifest.files.some((entry) => entry.file.includes("supabase/migrations/")), true);
});

test("v35 coordinated release tuple contract structure and compatibility validation", () => {
  const tuplePath = path.resolve("docs/convergence/v35/RELEASE_TUPLE.json");
  assert.ok(fs.existsSync(tuplePath), "RELEASE_TUPLE.json must exist in docs/convergence/v35/");

  const tuple = JSON.parse(fs.readFileSync(tuplePath, "utf8"));
  assert.equal(tuple.contract_id, "FARELY-V35-RELEASE-TUPLE");
  assert.ok(tuple.frontend_release_sha, "Must declare frontend_release_sha");
  assert.ok(tuple.edge_runtime_sha, "Must declare edge_runtime_sha");
  assert.ok(tuple.db_migration_head, "Must declare db_migration_head");
  assert.ok(tuple.worker_revision, "Must declare worker_revision");
  assert.ok(tuple.active_generation_id, "Must declare active_generation_id");
  assert.ok(tuple.api_contract_version, "Must declare api_contract_version");
  assert.ok(tuple.compatibility_matrix, "Must declare compatibility_matrix");

  // Verify compatibility evaluation using the registered tuple
  const evalResult = evaluateReleaseTupleCompatibility({
    frontendSha: tuple.frontend_release_sha,
    edgeSha: tuple.edge_runtime_sha,
    registeredTuples: [tuple]
  });
  assert.equal(evalResult.valid, true);
  assert.equal(evalResult.status, "COMPATIBLE");
  assert.equal(evalResult.parity_mode, "COMPATIBLE_TUPLE");
  assert.equal(evalResult.matched_tuple_id, tuple.tuple_id);
});
