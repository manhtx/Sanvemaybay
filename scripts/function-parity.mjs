/* global process, console */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function localFunctionNames(directory = "supabase/functions") {
  return readdirSync(directory)
    .filter((name) => existsSync(`${directory}/${name}/index.ts`))
    .sort();
}

export function remoteFunctionNames(payload) {
  if (!payload) return [];
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload.functions) ? payload.functions : []);
  return list
    .map((entry) => {
      if (typeof entry === "string") return entry;
      return typeof entry?.slug === "string" ? entry.slug : "";
    })
    .filter((slug) => /^[a-z0-9-]{1,80}$/.test(slug))
    .sort();
}

export function parseFunctionText(content) {
  if (typeof content !== "string") return [];
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return remoteFunctionNames(parsed);
    } catch {
      // ignore and try table parsing
    }
  }
  const lines = trimmed.split("\n");
  const slugs = [];
  for (const line of lines) {
    if (!line.includes("|")) continue;
    const lower = line.toLowerCase();
    if (lower.includes("slug") && (lower.includes("name") || lower.includes("status"))) continue;
    if (line.includes("---+---") || line.includes("---|---")) continue;
    const cols = line.split("|").map((c) => c.trim());
    for (const col of cols) {
      if (/^[a-z0-9-]{3,80}$/.test(col) && !["active", "inactive", "status", "name", "slug", "updated_at", "created_at"].includes(col)) {
        slugs.push(col);
      }
    }
  }
  return [...new Set(slugs)].sort();
}

export function evaluateFunctionParity(localNames, remoteNames) {
  const local = [...new Set(localNames)].sort();
  const remote = [...new Set(remoteNames)].sort();
  const localSet = new Set(local);
  const remoteSet = new Set(remote);
  const remoteOnly = remote.filter((name) => !localSet.has(name));
  return {
    ok: remoteOnly.length === 0,
    local_count: local.length,
    remote_count: remote.length,
    pending_deploy: local.filter((name) => !remoteSet.has(name)),
    remote_only_functions: remoteOnly,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: node scripts/function-parity.mjs <supabase-functions-list.json>");
  const content = readFileSync(input, "utf8");
  const remoteNames = parseFunctionText(content);
  const result = evaluateFunctionParity(localFunctionNames(), remoteNames);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
