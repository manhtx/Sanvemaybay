/* global process, console */
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function localMigrationVersions(directory = "supabase/migrations") {
  return readdirSync(directory)
    .map((name) => name.match(/^(\d{14})_.+\.sql$/)?.[1])
    .filter(Boolean)
    .sort();
}

export function remoteMigrationVersions(payload) {
  if (!payload || !Array.isArray(payload.migrations)) return [];
  return payload.migrations
    .map((entry) => typeof entry?.remote === "string" ? entry.remote : "")
    .filter((version) => /^\d{14}$/.test(version))
    .sort();
}

export function evaluateMigrationParity(localVersions, remoteVersions) {
  const duplicates = localVersions.filter((version, index) => localVersions.indexOf(version) !== index);
  const local = [...new Set(localVersions)].sort();
  const remote = [...new Set(remoteVersions)].sort();
  const localSet = new Set(local);
  const remoteSet = new Set(remote);
  const remoteOnly = remote.filter((version) => !localSet.has(version));
  const appliedIndexes = local.flatMap((version, index) => remoteSet.has(version) ? [index] : []);
  const highestAppliedIndex = appliedIndexes.length ? Math.max(...appliedIndexes) : -1;
  const missingBeforeApplied = highestAppliedIndex < 0
    ? []
    : local.slice(0, highestAppliedIndex + 1).filter((version) => !remoteSet.has(version));
  const pending = local.filter((version) => !remoteSet.has(version));
  return {
    ok: duplicates.length === 0 && remoteOnly.length === 0 && missingBeforeApplied.length === 0,
    local_count: local.length,
    remote_count: remote.length,
    pending,
    duplicate_local_versions: [...new Set(duplicates)],
    remote_only_versions: remoteOnly,
    missing_before_applied: missingBeforeApplied,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: node scripts/migration-parity.mjs <supabase-migration-list.json>");
  const payload = JSON.parse(readFileSync(input, "utf8"));
  const result = evaluateMigrationParity(localMigrationVersions(), remoteMigrationVersions(payload));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
