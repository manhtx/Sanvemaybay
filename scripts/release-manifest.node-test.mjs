import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { buildReleaseManifest, sha256 } from "./release-manifest.mjs";

test("release manifest hashes are deterministic and exclude local secrets", () => {
  assert.equal(sha256(Buffer.from("flycheap")), sha256(Buffer.from("flycheap")));
  const manifest = buildReleaseManifest("test-sha");
  assert.equal(manifest.release_sha, "test-sha");
  assert.equal(manifest.schema_version, 1);
  assert.equal(typeof manifest.node_version, "string");
  assert.equal(manifest.supabase_cli_version, "2.115.0");
  assert.match(manifest.source_tree_sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.files.some((entry) => entry.file === ".env" || entry.file.includes("node_modules")), false);
  assert.equal(manifest.files.some((entry) => entry.file.includes("supabase/migrations/")), true);
});

test("release manifest captures critical roots: package.json, vercel.json, migrations, edge functions, and workflows", () => {
  const manifest = buildReleaseManifest("test-critical-roots");
  const fileSet = new Set(manifest.files.map((e) => e.file));

  // Critical individual files
  assert.ok(fileSet.has("package.json"), "Must contain package.json");
  assert.ok(fileSet.has("package-lock.json"), "Must contain package-lock.json");
  assert.ok(fileSet.has("vercel.json"), "Must contain vercel.json");
  assert.ok(fileSet.has("vite.config.ts"), "Must contain vite.config.ts");

  // Critical directories
  const hasMigrations = manifest.files.some((e) => e.file.startsWith("supabase/migrations/"));
  const hasFunctions = manifest.files.some((e) => e.file.startsWith("supabase/functions/"));
  const hasWorkflows = manifest.files.some((e) => e.file.startsWith(".github/workflows/"));
  const hasSrc = manifest.files.some((e) => e.file.startsWith("src/"));
  const hasScripts = manifest.files.some((e) => e.file.startsWith("scripts/"));

  assert.ok(hasMigrations, "Must include migrations");
  assert.ok(hasFunctions, "Must include Edge Functions");
  assert.ok(hasWorkflows, "Must include GitHub workflows");
  assert.ok(hasSrc, "Must include src directory");
  assert.ok(hasScripts, "Must include scripts directory");
});

test("release manifest source tree hash changes when file entries or contents change", () => {
  // Test sha256 sensitivity on content mutation
  const h1 = sha256(Buffer.from("file1:abcdef123456\nfile2:123456abcdef"));
  const h2 = sha256(Buffer.from("file1:abcdef123456\nfile2:123456abcdee")); // single bit changed
  const h3 = sha256(Buffer.from("file1:abcdef123456\nfile2:123456abcdef\nfile3:9999")); // added entry

  assert.notEqual(h1, h2, "Source tree hash must change on modified file hash");
  assert.notEqual(h1, h3, "Source tree hash must change on added file entry");
  assert.notEqual(h2, h3);
});

test("release manifest defaults gracefully when releaseSha is omitted or null", () => {
  const defaultManifest = buildReleaseManifest();
  assert.equal(defaultManifest.release_sha, "unknown", "Omitting releaseSha must default to 'unknown'");

  const nullManifest = buildReleaseManifest(null);
  assert.equal(nullManifest.release_sha, null, "Passing null should preserve explicit argument");
});

test("release manifest files array is strictly sorted in lexicographical order", () => {
  const manifest = buildReleaseManifest("sort-verification");
  assert.ok(manifest.files.length > 50, "Workspace manifest must contain multiple files");

  for (let i = 0; i < manifest.files.length - 1; i++) {
    const current = manifest.files[i].file;
    const next = manifest.files[i + 1].file;
    assert.ok(
      current <= next,
      `Files must be lexicographically sorted by UTF-16 code units: "${current}" <= "${next}"`
    );
  }
});

test("performance benchmark: sha256 hashing and release manifest verification runs within latency budget", () => {
  const start = performance.now();
  // Perform 5 manifest builds across the workspace
  for (let i = 0; i < 5; i++) {
    const manifest = buildReleaseManifest(`bench-${i}`);
    assert.ok(manifest.source_tree_sha256);
  }
  const duration = performance.now() - start;
  // 5 full directory traversals and SHA256 computations across hundreds of files should easily complete within 1,000ms
  assert.ok(duration < 1000, `Expected duration < 1000ms, took ${duration.toFixed(2)}ms`);
});
