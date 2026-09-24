/* global process, console */
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function resolveReleaseSha(environment = process.env) {
  const candidate = environment.VITE_RELEASE_SHA
    ?? environment.VERCEL_GIT_COMMIT_SHA
    ?? environment.GITHUB_SHA
    ?? "";
  return /^[a-f0-9]{7,64}$/i.test(candidate) ? candidate.toLowerCase() : "unknown";
}

export function generateReleaseMetadata(outputDirectory, environment = process.env) {
  const metadata = {
    schema_version: 1,
    release_sha: resolveReleaseSha(environment),
    generated_at: new Date().toISOString(),
  };
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(`${outputDirectory}/release.json`, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const metadata = generateReleaseMetadata("dist");
  if (metadata.release_sha === "unknown") {
    console.warn("Frontend release SHA unavailable; production same-SHA gate will fail closed.");
  } else {
    console.log(`Frontend release metadata generated for ${metadata.release_sha}`);
  }
}
