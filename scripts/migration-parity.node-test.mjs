import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMigrationParity, remoteMigrationVersions, parseMigrationText, localMigrationVersions } from "./migration-parity.mjs";

const local = ["20260101000000", "20260102000000", "20260103000000"];

test("migration parity accepts a clean database and contiguous pending suffix", () => {
  assert.equal(evaluateMigrationParity(local, []).ok, true);
  const pending = evaluateMigrationParity(local, ["20260101000000", "20260102000000"]);
  assert.equal(pending.ok, true);
  assert.deepEqual(pending.pending, ["20260103000000"]);
});

test("migration parity fails closed for remote-only contamination", () => {
  const result = evaluateMigrationParity(local, ["20260101000000", "20261231000000"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.remote_only_versions, ["20261231000000"]);
});

test("migration parity fails when an old local migration is missing before an applied version", () => {
  const result = evaluateMigrationParity(local, ["20260101000000", "20260103000000"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing_before_applied, ["20260102000000"]);
});

test("migration list parser ignores local-only and malformed entries", () => {
  const versions = remoteMigrationVersions({ migrations: [
    { local: "20260101000000", remote: "" },
    { local: "20260102000000", remote: "20260102000000" },
    { remote: "not-a-version" },
  ] });
  assert.deepEqual(versions, ["20260102000000"]);
});

test("migration list text parser parses ASCII table correctly", () => {
  const table = `
   Local            | Remote           | Time (UTC)            
--------------------+------------------+-----------------------
   20260101000000   | 20260101000000   | 2026-01-01 00:00:00   
   20260102000000   | 20260102000000   | 2026-01-02 00:00:00   
   20260103000000   |                  |                       
`;
  const parsed = parseMigrationText(table);
  assert.deepEqual(parsed, ["20260101000000", "20260102000000"]);
});

test("migration parity detects duplicate local migration versions and fails closed", () => {
  const duplicateVersions = ["20260101000000", "20260101000000", "20260102000000"];
  const result = evaluateMigrationParity(duplicateVersions, ["20260101000000"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.duplicate_local_versions, ["20260101000000"]);
});

test("localMigrationVersions discovers repository migrations and satisfies benchmark", () => {
  const versions = localMigrationVersions();
  assert.ok(versions.length > 0, "Must discover local migration files");
  for (const v of versions) {
    assert.match(v, /^\d{14}$/, `Version ${v} must be a 14-digit timestamp`);
  }
  // Strictly sorted
  for (let i = 1; i < versions.length; i++) {
    assert.ok(versions[i] > versions[i - 1], `Migrations must be strictly ascending: ${versions[i - 1]} < ${versions[i]}`);
  }

  // Parity evaluation benchmark
  const start = performance.now();
  const iterations = 2000;
  for (let i = 0; i < iterations; i++) {
    evaluateMigrationParity(versions, versions);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 100, `Migration parity benchmark took ${duration.toFixed(2)}ms, expected < 100ms`);
});
