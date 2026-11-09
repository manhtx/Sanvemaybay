import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  INDEXABLE_ROUTES,
  generateSeoAssets,
  productionOrigin,
  robotsText,
  sitemapXml,
} from "./generate-seo-assets.mjs";

test("productionOrigin fails closed on missing, HTTP, and local URLs", () => {
  assert.equal(productionOrigin(undefined), undefined);
  assert.equal(productionOrigin(null), undefined);
  assert.equal(productionOrigin(""), undefined);
  assert.equal(productionOrigin("http://flycheap.example"), undefined, "HTTP protocol must return undefined");
  assert.equal(productionOrigin("https://localhost:5173"), undefined, "localhost must return undefined");
  assert.equal(productionOrigin("https://127.0.0.1:8000"), undefined, "127.0.0.1 must return undefined");
  assert.equal(productionOrigin("https://0.0.0.0"), undefined, "0.0.0.0 must return undefined");
  assert.equal(productionOrigin("not-a-url"), undefined, "malformed string must return undefined");
});

test("productionOrigin normalizes complex HTTPS URLs by stripping paths, queries, and trailing slashes", () => {
  assert.equal(productionOrigin("https://flycheap.example"), "https://flycheap.example");
  assert.equal(productionOrigin("https://flycheap.example/"), "https://flycheap.example");
  assert.equal(productionOrigin("https://flycheap.example/nested/path"), "https://flycheap.example");
  assert.equal(productionOrigin("https://flycheap.example?query=1&b=2"), "https://flycheap.example");
  assert.equal(productionOrigin("https://subdomain.flycheap.example:8443/page"), "https://subdomain.flycheap.example:8443");
});

test("sitemapXml generates valid XML with urlset namespace, YYYY-MM-DD lastmod, and all indexable routes", () => {
  const xml = sitemapXml("https://flycheap.example");

  // Verify XML declaration and schema namespace
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, "sitemapXml must begin with XML declaration");
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/, "sitemapXml must declare sitemaps schema");

  // Verify all 9 approved indexable routes are included
  assert.equal(INDEXABLE_ROUTES.length, 9, "INDEXABLE_ROUTES must contain 9 routes");
  for (const route of INDEXABLE_ROUTES) {
    const loc = route === "/" ? "https://flycheap.example/" : `https://flycheap.example${route}`;
    assert.match(xml, new RegExp(`<loc>${loc}</loc>`), `sitemap must include route: ${loc}`);
  }

  // Verify lastmod date format YYYY-MM-DD
  assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, "sitemap must contain YYYY-MM-DD lastmod");

  // Verify private or parameter routes are excluded
  assert.doesNotMatch(xml, /\/auth|\/saved|\/alerts\/confirm|\/deals\/:id/, "sitemap must exclude private or dynamic routes");
});

test("robotsText enforces disallows on private user paths and conditionally includes sitemap directive", () => {
  // With production origin: sitemap directive included
  const withOrigin = robotsText("https://flycheap.example");
  assert.match(withOrigin, /User-agent: \*/, "robots.txt must declare User-agent: *");
  assert.match(withOrigin, /Allow: \//, "robots.txt must allow root");
  assert.match(withOrigin, /Disallow: \/auth/, "robots.txt must disallow /auth");
  assert.match(withOrigin, /Disallow: \/saved/, "robots.txt must disallow /saved");
  assert.match(withOrigin, /Disallow: \/alerts\/confirm/, "robots.txt must disallow /alerts/confirm");
  assert.match(withOrigin, /Disallow: \/alerts\/unsubscribe/, "robots.txt must disallow /alerts/unsubscribe");
  assert.match(withOrigin, /Sitemap: https:\/\/flycheap\.example\/sitemap\.xml/, "robots.txt must include Sitemap directive");

  // Without production origin: sitemap directive omitted
  const withoutOrigin = robotsText(undefined);
  assert.doesNotMatch(withoutOrigin, /Sitemap:/, "robots.txt without origin must omit Sitemap directive");
});

test("generateSeoAssets writes robots.txt and sitemap.xml to target directory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flycheap-seo-"));
  try {
    // 1. With production origin: writes robots.txt and sitemap.xml
    const resultValid = generateSeoAssets(directory, "https://flycheap.example");
    assert.equal(resultValid.origin, "https://flycheap.example");
    assert.equal(resultValid.sitemapGenerated, true);

    const robotsContent = await readFile(join(directory, "robots.txt"), "utf8");
    const sitemapContent = await readFile(join(directory, "sitemap.xml"), "utf8");
    assert.match(robotsContent, /User-agent: \*/);
    assert.match(sitemapContent, /<urlset/);

    // 2. With invalid origin: writes robots.txt, skips sitemap.xml
    const dirInvalid = await mkdtemp(join(tmpdir(), "flycheap-seo-invalid-"));
    try {
      const resultInvalid = generateSeoAssets(dirInvalid, "http://insecure.local");
      assert.equal(resultInvalid.origin, undefined);
      assert.equal(resultInvalid.sitemapGenerated, false);

      const robotsInvalid = await readFile(join(dirInvalid, "robots.txt"), "utf8");
      assert.match(robotsInvalid, /Disallow: \/auth/);
    } finally {
      await rm(dirInvalid, { recursive: true, force: true });
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("performance benchmark: 1,000 SEO asset evaluations execute in under 50ms", () => {
  const start = performance.now();
  const origin = "https://flycheap.example";

  for (let i = 0; i < 1000; i++) {
    const o = productionOrigin(origin);
    const r = robotsText(o);
    if (!r.includes("User-agent")) throw new Error("Benchmark failed");
  }

  const elapsed = performance.now() - start;
  assert.ok(elapsed < 50, `1,000 SEO asset operations must execute in under 50ms (took ${elapsed.toFixed(2)}ms)`);
});
