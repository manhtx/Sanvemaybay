import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFunctionParity, remoteFunctionNames } from "./function-parity.mjs";

test("function parity accepts a clean runtime and local pending deployments", () => {
  assert.equal(evaluateFunctionParity(["feed", "search"], []).ok, true);
  const result = evaluateFunctionParity(["feed", "search"], ["feed"]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.pending_deploy, ["search"]);
});

test("function parity fails closed for remote-only source drift", () => {
  const result = evaluateFunctionParity(["feed"], ["archive-import", "feed"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.remote_only_functions, ["archive-import"]);
});

test("function parser rejects malformed slugs", () => {
  assert.deepEqual(remoteFunctionNames({ functions: [
    { slug: "observed-fares" },
    { slug: "../../unsafe" },
    { name: "missing-slug" },
  ] }), ["observed-fares"]);
});
