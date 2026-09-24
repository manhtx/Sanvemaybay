import test from "node:test";
import assert from "node:assert/strict";
import { INDEXABLE_ROUTES, productionOrigin, robotsText, sitemapXml } from "./generate-seo-assets.mjs";

test("SEO origin fails closed for missing, HTTP and local URLs", () => {
  assert.equal(productionOrigin(undefined), undefined);
  assert.equal(productionOrigin("http://flycheap.example"), undefined);
  assert.equal(productionOrigin("https://localhost:5173"), undefined);
  assert.equal(productionOrigin("https://flycheap.example/path"), "https://flycheap.example");
});

test("sitemap contains only approved indexable routes", () => {
  const xml = sitemapXml("https://flycheap.example");
  for (const route of INDEXABLE_ROUTES) assert.match(xml, new RegExp(`<loc>https://flycheap\\.example${route === "/" ? "/" : route}</loc>`));
  assert.doesNotMatch(xml, /\/auth|\/saved|\/alerts\/confirm|\/deals\/:id/);
  assert.match(robotsText("https://flycheap.example"), /Sitemap: https:\/\/flycheap\.example\/sitemap\.xml/);
});
