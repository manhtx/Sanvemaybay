/* global process, console */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function localFunctionNames(directory = "supabase/functions") {
  return readdirSync(directory)
    .filter((name) => existsSync(`${directory}/${name}/index.ts`))
    .sort();
}

export function remoteFunctionNames(payload) {
  if (!payload || !Array.isArray(payload.functions)) return [];
  return payload.functions
    .map((entry) => typeof entry?.slug === "string" ? entry.slug : "")
    .filter((slug) => /^[a-z0-9-]{1,80}$/.test(slug))
    .sort();
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
  const payload = JSON.parse(readFileSync(input, "utf8"));
  const result = evaluateFunctionParity(localFunctionNames(), remoteFunctionNames(payload));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
