import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateReleaseMetadata, resolveReleaseSha } from "./generate-release-metadata.mjs";

test("frontend release SHA candidate priority: VITE_RELEASE_SHA > VERCEL_GIT_COMMIT_SHA > GITHUB_SHA", () => {
  // VITE_RELEASE_SHA takes highest priority
  assert.equal(
    resolveReleaseSha({
      VITE_RELEASE_SHA: "1111111111111",
      VERCEL_GIT_COMMIT_SHA: "2222222222222",
      GITHUB_SHA: "3333333333333",
    }),
    "1111111111111",
    "VITE_RELEASE_SHA must override Vercel and GitHub SHAs",
  );

  // VERCEL_GIT_COMMIT_SHA takes priority over GITHUB_SHA
  assert.equal(
    resolveReleaseSha({
      VERCEL_GIT_COMMIT_SHA: "2222222222222",
      GITHUB_SHA: "3333333333333",
    }),
    "2222222222222",
    "VERCEL_GIT_COMMIT_SHA must override GITHUB_SHA",
  );

  // GITHUB_SHA used as fallback
  assert.equal(
    resolveReleaseSha({
      GITHUB_SHA: "3333333333333",
    }),
    "3333333333333",
    "GITHUB_SHA must be resolved when others are absent",
  );
});

test("frontend release SHA validation: accepts 7-64 hex chars with lowercasing, rejects non-hex and injections", () => {
  // Uppercase hex gets lowercased
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "ABCDEF1234567" }), "abcdef1234567");

  // 7-character short SHA accepted
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "abcdef0" }), "abcdef0");

  // 40-character standard Git SHA accepted
  const sha40 = "71d6bcce98061facf6932b5de42538e61701e36a";
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: sha40 }), sha40);

  // 64-character SHA-256 accepted
  const sha64 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: sha64 }), sha64);

  // Non-hex characters (g-z) rejected
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "123456g" }), "unknown");

  // Too short (< 7 chars) rejected
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "123456" }), "unknown");

  // Branch names, spaces, scripts rejected
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "refs/heads/main" }), "unknown");
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "abcdef 12345" }), "unknown");
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "branch/main<script>" }), "unknown");
});

test("frontend release SHA fail-closed handling on missing, empty, or undefined environment", () => {
  assert.equal(resolveReleaseSha({}), "unknown");
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: "" }), "unknown");
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: undefined }), "unknown");
  assert.equal(resolveReleaseSha({ VITE_RELEASE_SHA: null }), "unknown");
});

test("frontend release metadata artifact structure and schema_version 1 verification on disk", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flycheap-release-"));
  try {
    const metadata = generateReleaseMetadata(directory, { VITE_RELEASE_SHA: "abcdef1234567" });
    const content = await readFile(join(directory, "release.json"), "utf8");
    const written = JSON.parse(content);

    assert.equal(metadata.release_sha, "abcdef1234567");
    assert.equal(written.release_sha, "abcdef1234567");
    assert.equal(written.schema_version, 1);
    assert.ok(typeof written.generated_at === "string", "generated_at must be an ISO string");
    assert.ok(!isNaN(new Date(written.generated_at).getTime()), "generated_at must be valid ISO date");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("frontend release metadata deterministic idempotency across repeated invocations", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flycheap-release-idemp-"));
  try {
    const env = { VITE_RELEASE_SHA: "aabbccddee112233" };
    const m1 = generateReleaseMetadata(directory, env);
    const m2 = generateReleaseMetadata(directory, env);

    assert.equal(m1.release_sha, m2.release_sha);
    assert.equal(m1.schema_version, m2.schema_version);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("performance benchmark: 1,000 release SHA resolutions execute in under 50ms", () => {
  const start = performance.now();
  const env = { VITE_RELEASE_SHA: "abcdef1234567" };

  for (let i = 0; i < 1000; i++) {
    const sha = resolveReleaseSha(env);
    if (sha !== "abcdef1234567") throw new Error("Benchmark failed");
  }

  const elapsed = performance.now() - start;
  assert.ok(elapsed < 50, `1,000 SHA resolutions must execute in under 50ms (took ${elapsed.toFixed(2)}ms)`);
});

test("frontend release metadata: directory creation resilience, file overwrite, and error handling", async () => {
  const baseDir = await mkdtemp(join(tmpdir(), "flycheap-release-resilience-"));
  const nestedDir = join(baseDir, "nested", "release", "dir");

  try {
    // 1. Recursive directory creation
    const m1 = generateReleaseMetadata(nestedDir, { VITE_RELEASE_SHA: "1234567" });
    assert.equal(m1.release_sha, "1234567");

    // 2. Overwrite existing release.json atomically
    const m2 = generateReleaseMetadata(nestedDir, { VITE_RELEASE_SHA: "7654321" });
    assert.equal(m2.release_sha, "7654321");

    const content = await readFile(join(nestedDir, "release.json"), "utf8");
    const parsed = JSON.parse(content);
    assert.equal(parsed.release_sha, "7654321");
    assert.equal(parsed.schema_version, 1);

    // 3. Invalid output directory path fails closed with error
    assert.throws(
      () => generateReleaseMetadata(join(nestedDir, "release.json", "forbidden")),
      /ENOTDIR|ENOENT|Error/
    );
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
});
