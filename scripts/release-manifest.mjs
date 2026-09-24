/* global process, console */
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT_FILES = ["package.json", "package-lock.json", "vercel.json", "vite.config.ts"];
const ROOT_DIRECTORIES = ["src", "supabase/functions", "supabase/migrations", ".github/workflows", "scripts"];

function filesUnder(path) {
  return readdirSync(path).flatMap((entry) => {
    const child = `${path}/${entry}`;
    return statSync(child).isDirectory() ? filesUnder(child) : [child];
  });
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildReleaseManifest(releaseSha = "unknown") {
  const files = [...ROOT_FILES, ...ROOT_DIRECTORIES.flatMap(filesUnder)].sort();
  const entries = files.map((file) => ({ file, sha256: sha256(readFileSync(file)) }));
  return {
    schema_version: 1,
    release_sha: releaseSha,
    node_version: process.version,
    supabase_cli_version: "2.115.0",
    generated_at: new Date().toISOString(),
    source_tree_sha256: sha256(Buffer.from(entries.map((entry) => `${entry.file}:${entry.sha256}`).join("\n"))),
    files: entries,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(buildReleaseManifest(process.env.DEPLOYED_COMMIT ?? process.env.GITHUB_SHA ?? "unknown"), null, 2));
}
