import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateReleaseMetadata, resolveReleaseSha } from "./generate-release-metadata.mjs";

test("frontend release SHA uses supported CI providers and rejects unsafe values", () => {
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "ABCDEF1234567" }), "abcdef1234567");
  assert.equal(resolveReleaseSha({ VERCEL_GIT_COMMIT_SHA: "1234567890abcdef" }), "1234567890abcdef");
  assert.equal(resolveReleaseSha({ GITHUB_SHA: "abcdef1234567" }), "abcdef1234567");
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "branch/main<script>" }), "unknown");
});

test("frontend build emits a machine-readable release artifact", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flycheap-release-"));
  try {
    const metadata = generateReleaseMetadata(directory, { VITE_RELEASE_SHA: "abcdef1234567" });
    const written = JSON.parse(await readFile(join(directory, "release.json"), "utf8"));
    assert.equal(metadata.release_sha, "abcdef1234567");
    assert.equal(written.release_sha, "abcdef1234567");
    assert.equal(written.schema_version, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
