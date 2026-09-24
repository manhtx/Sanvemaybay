import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

test("hosting policy allows only reviewed script and network boundaries", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const headers = config.headers?.find((rule) => rule.source === "/(.*)")?.headers ?? [];
  const value = Object.fromEntries(headers.map((header) => [header.key, header.value]));
  assert.match(value["Content-Security-Policy"], /script-src 'self' https:\/\/challenges\.cloudflare\.com/);
  assert.match(value["Content-Security-Policy"], /connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co/);
  assert.match(value["Content-Security-Policy"], /object-src 'none'/);
  assert.match(value["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.doesNotMatch(value["Content-Security-Policy"], /tpembars|unsafe-eval|script-src[^;]*unsafe-inline/);
  assert.equal(value["X-Content-Type-Options"], "nosniff");
  assert.equal(value["X-Frame-Options"], "DENY");
});

test("hosting keeps the SPA fallback after static asset resolution", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(config.rewrites, [{ source: "/(.*)", destination: "/index.html" }]);
});

test("production smoke rejects SPA fallbacks and unreviewed production scripts", async () => {
  const workflow = await readFile(new URL("../.github/workflows/production-smoke.yml", import.meta.url), "utf8");
  assert.match(workflow, /content-security-policy:/);
  assert.match(workflow, /tpembars\.com/);
  assert.match(workflow, /content-type: text\/plain/);
  assert.match(workflow, /content-type: \(application\|text\)\/xml/);
  assert.match(workflow, /<loc>\$origin\/deals<\/loc>/);
  assert.match(workflow, /MIN_OBSERVED_FARES/);
  assert.match(workflow, /payload\.get\('status'\) != 'healthy'/);
  assert.match(workflow, /observed feed has no freshness age/);
});
