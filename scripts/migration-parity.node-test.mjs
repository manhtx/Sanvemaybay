import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMigrationParity, remoteMigrationVersions, parseMigrationText } from "./migration-parity.mjs";

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
