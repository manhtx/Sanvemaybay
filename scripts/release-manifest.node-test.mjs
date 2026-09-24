import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { buildReleaseManifest, sha256 } from "./release-manifest.mjs";

test("release manifest hashes are deterministic and exclude local secrets", () => {
  assert.equal(sha256(Buffer.from("flycheap")), sha256(Buffer.from("flycheap")));
  const manifest = buildReleaseManifest("test-sha");
  assert.equal(manifest.release_sha, "test-sha");
  assert.match(manifest.source_tree_sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.files.some((entry) => entry.file === ".env" || entry.file.includes("node_modules")), false);
  assert.equal(manifest.files.some((entry) => entry.file.includes("supabase/migrations/")), true);
});
