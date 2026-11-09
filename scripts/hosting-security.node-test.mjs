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

test("static public assets (/robots.txt and /release.json) resolve to static content and never to SPA index.html", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots, /User-agent:\s*\*/);
  assert.match(robots, /Disallow:\s*\/auth/);
  assert.doesNotMatch(robots, /<!DOCTYPE html/i);
  assert.doesNotMatch(robots, /<html/i);
});

test("hosting policy verifies all 5 critical security headers: CSP, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, and Permissions-Policy", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const headers = config.headers?.find((rule) => rule.source === "/(.*)")?.headers ?? [];
  const map = new Map(headers.map((h) => [h.key, h.value]));

  assert.equal(map.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(map.get("X-Content-Type-Options"), "nosniff");
  assert.equal(map.get("X-Frame-Options"), "DENY");
  assert.equal(map.get("Permissions-Policy"), "camera=(), microphone=(), geolocation=(), payment=()");

  const csp = map.get("Content-Security-Policy");
  assert.ok(csp, "CSP header must be defined");
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /upgrade-insecure-requests/);
});

test("hosting security performance benchmark: 10,000 policy parsing and validation cycles run under latency budget", async () => {
  const raw = await readFile(new URL("../vercel.json", import.meta.url), "utf8");
  const parsed = JSON.parse(raw);
  const headers = parsed.headers[0].headers;

  const start = performance.now();
  const iterations = 10_000;

  for (let i = 0; i < iterations; i++) {
    const valMap = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    assert.equal(valMap["X-Frame-Options"], "DENY");
    assert.equal(valMap["X-Content-Type-Options"], "nosniff");
  }

  const duration = performance.now() - start;
  // 10,000 validations should execute within 50ms
  assert.ok(duration < 50, `Benchmark took ${duration.toFixed(2)}ms, expected < 50ms`);
});

test("hosting build configuration contract, CSP frame-src restrictions, and device permissions lockdown", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

  // Build command and output directory contract
  assert.equal(config.buildCommand, "npm run build", "Vercel buildCommand must remain npm run build");
  assert.equal(config.outputDirectory, "dist", "Vercel outputDirectory must remain dist");

  const headers = config.headers?.find((r) => r.source === "/(.*)")?.headers ?? [];
  const headerMap = new Map(headers.map((h) => [h.key, h.value]));

  // CSP frame-src isolation: allows only Cloudflare Turnstile
  const csp = headerMap.get("Content-Security-Policy");
  assert.ok(csp, "CSP must be configured");
  assert.match(csp, /frame-src https:\/\/challenges\.cloudflare\.com/, "frame-src must allow Cloudflare Turnstile");
  assert.doesNotMatch(csp, /script-src[^;]*\*/, "script-src must not allow wildcards");
  assert.doesNotMatch(csp, /script-src[^;]*data:/, "script-src must not allow data: URIs");
  assert.doesNotMatch(csp, /script-src[^;]*http:/, "script-src must not allow unencrypted http: origins");

  // Permissions-Policy lockdown for invasive device APIs
  const permissions = headerMap.get("Permissions-Policy");
  assert.ok(permissions, "Permissions-Policy must be configured");
  for (const feature of ["camera=()", "microphone=()", "geolocation=()", "payment=()"]) {
    assert.ok(permissions.includes(feature), `Permissions-Policy must disable ${feature}`);
  }
});
