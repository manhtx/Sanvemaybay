/* global console */
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const PRODUCTION_URL = "https://farely.manhtx.com";
const SUPABASE_URL = "https://yefbpmqfsstcaeqfrmyn.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmJwbXFmc3N0Y2FlcWZybXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mzk2MjQsImV4cCI6MjEwNjIxNTYyNH0.FxYMbfcX9Rg9Jj0L_D2VkX-Apzb6Iy5GqAeKlNpTRpc";

console.log("=== FARELY ZERO-TRUST LIVE PRODUCTION AUDIT ===");
console.log(`Target: ${PRODUCTION_URL}`);

// 1. Release manifest check
console.log("\n[1/6] Verifying release identity...");
const releaseRes = await fetch(`${PRODUCTION_URL}/release.json`);
assert.equal(releaseRes.status, 200, "release.json must return 200");
const releaseData = await releaseRes.json();
console.log(`Frontend Deployed SHA: ${releaseData.release_sha} (generated: ${releaseData.generated_at})`);
assert.ok(releaseData.release_sha, "release_sha must exist");

// 2. Edge Function verification
console.log("\n[2/6] Verifying observed-fares Edge Function...");
const observedRes = await fetch(`${SUPABASE_URL}/functions/v1/observed-fares`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": ANON_KEY,
    "Authorization": `Bearer ${ANON_KEY}`,
  },
  body: JSON.stringify({ page: 1, page_size: 5 }),
});
assert.equal(observedRes.status, 200, "observed-fares must return 200");
const observedData = await observedRes.json();
console.log(`Observed Fares Status: ${observedData.status}`);
console.log(`Total Inventory: ${observedData.total} snapshots`);
console.log(`Feed Age: ${observedData.feed_age_minutes} minutes`);
console.log(`Backend Release SHA: ${observedData.release_sha}`);
assert.ok(observedData.status === "healthy" || observedData.status === "degraded_freshness", `Expected healthy or degraded_freshness, got ${observedData.status}`);
assert.ok(observedData.total > 1000, `Expected >1000 fares, got ${observedData.total}`);

// 3. Test filters and sorting on observed-fares
console.log("\n[3/6] Verifying server-side filters & sorting...");
const domesticRes = await fetch(`${SUPABASE_URL}/functions/v1/observed-fares`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": ANON_KEY,
    "Authorization": `Bearer ${ANON_KEY}`,
  },
  body: JSON.stringify({ region: "domestic", sort: "price_asc", page: 1, page_size: 5 }),
});
const domesticData = await domesticRes.json();
assert.ok(domesticData.status === "healthy" || domesticData.status === "degraded_freshness");
assert.ok(domesticData.total > 500, `Expected >500 domestic fares, got ${domesticData.total}`);
console.log(`Domestic Inventory: ${domesticData.total} fares`);
console.log(`Lowest Domestic Fare: ${domesticData.fares[0].price.toLocaleString()} VND (${domesticData.fares[0].origin_code} -> ${domesticData.fares[0].destination_code}, ${domesticData.fares[0].airline})`);
assert.equal(domesticData.fares[0].region, "domestic");

// Check ascending price
for (let i = 1; i < domesticData.fares.length; i++) {
  assert.ok(domesticData.fares[i].price >= domesticData.fares[i - 1].price, "Prices must be ascending");
}

// 4. Test Single Opportunity Detail resolution
console.log("\n[4/6] Verifying Opportunity Detail resolution...");
const sampleFare = domesticData.fares[0];
const detailRes = await fetch(`${SUPABASE_URL}/functions/v1/observed-fares`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": ANON_KEY,
    "Authorization": `Bearer ${ANON_KEY}`,
  },
  body: JSON.stringify({ id: sampleFare.id }),
});
const detailData = await detailRes.json();
assert.ok(detailData.status === "healthy" || detailData.status === "degraded_freshness");
const resolvedFare = detailData.fares.find((f) => f.id === sampleFare.id);
assert.ok(resolvedFare, "Must resolve specific observed fare by id");
console.log(`Resolved Opportunity: ${resolvedFare.origin} -> ${resolvedFare.destination} (${resolvedFare.price.toLocaleString()} VND, Score: ${resolvedFare.deal_score}/100, ${resolvedFare.deal_label})`);

// 5. Static & SEO assets
console.log("\n[5/6] Verifying static & SEO assets...");
const robotsRes = await fetch(`${PRODUCTION_URL}/robots.txt`);
assert.equal(robotsRes.status, 200);
const robotsText = await robotsRes.text();
assert.ok(robotsText.includes("Sitemap: https://farely.manhtx.com/sitemap.xml"));
console.log("robots.txt: OK");

const sitemapRes = await fetch(`${PRODUCTION_URL}/sitemap.xml`);
assert.equal(sitemapRes.status, 200);
const sitemapText = await sitemapRes.text();
assert.ok(sitemapText.includes("<loc>https://farely.manhtx.com/deals</loc>"));
console.log("sitemap.xml: OK");

// 6. Real browser E2E session with Playwright
console.log("\n[6/6] Launching headless browser for real live user journey...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  // 6a. Deals Page
  console.log("Navigating to https://farely.manhtx.com/deals ...");
  await page.goto(`${PRODUCTION_URL}/deals`, { waitUntil: "networkidle" });
  
  // Verify branding
  const title = await page.title();
  console.log(`Page Title: ${title}`);
  assert.ok(title.includes("Farely") || title.includes("Vé Máy Bay"), "Title must be branded");

  // Check that deal cards rendered
  const cardLocator = page.locator("a[href^='/deals/observed-']");
  const count = await cardLocator.count();
  console.log(`Rendered Opportunity Cards: ${count}`);
  assert.ok(count > 0, "Deals page must render observed opportunity cards");

  // Verify first card details
  const firstCard = cardLocator.first();
  const firstCardText = await firstCard.innerText();
  console.log(`First Card Snippet:\n---\n${firstCardText.slice(0, 150)}...\n---`);
  assert.ok(firstCardText.includes("VND") || firstCardText.includes("₫"), "Card must display price");

  // 6b. Click card -> Navigate to Opportunity Detail
  const firstCardHref = await firstCard.getAttribute("href");
  console.log(`Clicking card target: ${firstCardHref}`);
  await Promise.all([
    page.waitForURL("**/deals/observed-*"),
    firstCard.click(),
  ]);
  await page.waitForLoadState("networkidle");

  const detailUrl = page.url();
  console.log(`Current Detail URL: ${detailUrl}`);
  assert.ok(detailUrl.includes("/deals/observed-"), "Must be on opportunity detail URL");

  // Wait for detail view to hydrate
  await page.waitForSelector("h1", { timeout: 10000 });
  const detailBody = await page.locator("#root").innerText();
  assert.ok(
    detailBody.includes("Căn cứ đánh dấu cơ hội") ||
    detailBody.includes("so với median") ||
    detailBody.includes("Kiểm tra giá") ||
    detailBody.includes("Lịch sử") ||
    detailBody.includes("BẰNG CHỨNG") ||
    detailBody.includes("Chi tiết chuyến bay") || 
    detailBody.includes("Lịch Sử Giá") || 
    detailBody.includes("GIẢM") ||
    detailBody.includes("HÃNG BAY"),
    "Detail page must display flight opportunity intelligence"
  );
  console.log("Opportunity Detail page verification: PASSED");

  // 6c. Search Page
  console.log("Navigating to https://farely.manhtx.com/search ...");
  await page.goto(`${PRODUCTION_URL}/search`, { waitUntil: "networkidle" });
  const searchInput = page.locator("input").first();
  assert.ok(await searchInput.isVisible(), "Search input must be visible");
  
  // Type origin filter
  await searchInput.fill("Hà Nội");
  await page.waitForTimeout(1000);
  console.log("Search page verification: PASSED");

  // 6d. Saved / Bookmarks Page
  console.log("Navigating to https://farely.manhtx.com/saved ...");
  await page.goto(`${PRODUCTION_URL}/saved`, { waitUntil: "networkidle" });
  const savedHeading = page.locator("h1, h2").first();
  assert.ok(await savedHeading.isVisible(), "Saved page heading must be visible");
  console.log("Saved page verification: PASSED");

  console.log("\n=== ALL ZERO-TRUST LIVE PRODUCTION CHECKS PASSED ===");
} finally {
  await browser.close();
}
