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
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => {
        if (typeof entry === "string") return entry;
        return typeof entry?.remote === "string" ? entry.remote : (typeof entry?.version === "string" ? entry.version : "");
      })
      .filter((version) => /^\d{14}$/.test(version))
      .sort();
  }
  if (Array.isArray(payload.migrations)) {
    return payload.migrations
      .map((entry) => typeof entry?.remote === "string" ? entry.remote : "")
      .filter((version) => /^\d{14}$/.test(version))
      .sort();
  }
  return [];
}

export function parseMigrationText(content) {
  if (typeof content !== "string") return [];
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return remoteMigrationVersions(parsed);
    } catch {
      // ignore and try table parsing
    }
  }
  const lines = trimmed.split("\n");
  const versions = [];
  for (const line of lines) {
    if (!line.includes("|")) continue;
    if (line.includes("Local") && line.includes("Remote")) continue;
    if (line.includes("---+---") || line.includes("---|---")) continue;
    const cols = line.split("|").map((c) => c.trim());
    if (cols.length >= 2) {
      const remote = cols[1];
      if (/^\d{14}$/.test(remote)) {
        versions.push(remote);
      }
    }
  }
  return [...new Set(versions)].sort();
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
  const content = readFileSync(input, "utf8");
  const remoteVersions = parseMigrationText(content);
  const result = evaluateMigrationParity(localMigrationVersions(), remoteVersions);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
