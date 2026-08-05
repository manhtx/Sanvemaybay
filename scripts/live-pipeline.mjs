/* global process, console, fetch, setTimeout */
import { readFileSync } from "node:fs";

function readDotEnv(path) {
  try {
    return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")]; }));
  } catch { return {}; }
}

const env = { ...readDotEnv(".env"), ...readDotEnv(".env.local"), ...process.env };
const baseUrl = String(env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const anonKey = String(env.VITE_SUPABASE_ANON_KEY ?? "");
const internalSecret = String(env.INTERNAL_FUNCTION_SECRET ?? "");
const targetDeals = Number(env.TARGET_DEALS ?? 1000);
const maxCycles = Number(env.PIPELINE_MAX_CYCLES ?? 48);
const routeBatchCount = Number(env.SCAN_ROUTE_BATCH_COUNT ?? 12);
const cycleDelayMs = Number(env.PIPELINE_CYCLE_DELAY_MS ?? 15_000);
const hotScore = Number(env.HOT_DEAL_SCORE ?? 80);
const hotDiscount = Number(env.HOT_DEAL_DISCOUNT ?? 20);
const hotConfidence = Number(env.HOT_DEAL_CONFIDENCE ?? 0.65);
const allowBelowTarget = String(env.PIPELINE_ALLOW_BELOW_TARGET ?? "false").toLowerCase() === "true";
const forceRefresh = String(env.PIPELINE_FORCE_REFRESH ?? "false").toLowerCase() === "true";

if (!baseUrl || !anonKey || !internalSecret) {
  console.error("Live pipeline blocked: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and INTERNAL_FUNCTION_SECRET are required.");
  process.exit(2);
}
if (!Number.isInteger(targetDeals) || targetDeals < 1 || !Number.isInteger(maxCycles) || maxCycles < 1 ||
    !Number.isFinite(hotScore) || hotScore < 0 || hotScore > 100 ||
    !Number.isFinite(hotDiscount) || hotDiscount < 0 || hotDiscount > 100 ||
    !Number.isFinite(hotConfidence) || hotConfidence < 0 || hotConfidence > 1) {
  console.error("Live pipeline configuration is invalid: target/cycle and hot-deal thresholds must be valid values.");
  process.exit(2);
}

const publicHeaders = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
const internalHeaders = {
  "Content-Type": "application/json",
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  "x-internal-secret": internalSecret,
};

async function invoke(name, method = "POST", body) {
  const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method,
    headers: internalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let responseBody;
  try { responseBody = JSON.parse(text); } catch { responseBody = { raw: text.slice(0, 200) }; }
  if (!response.ok) throw new Error(`${name} HTTP ${response.status}: ${JSON.stringify(responseBody)}`);
  return responseBody;
}

async function countHotDeals() {
  const query = [
    "select=id,deal_score,discount,confidence,booking_url,valid_until",
    `depart_date=gte.${encodeURIComponent(new Date().toISOString().slice(0, 10))}`,
    `valid_until=gt.${encodeURIComponent(new Date().toISOString())}`,
    `deal_score=gte.${hotScore}`,
    `discount=gte.${hotDiscount}`,
    `confidence=gte.${hotConfidence}`,
    "booking_url=not.is.null",
  ].join("&");
  const response = await fetch(`${baseUrl}/rest/v1/deals?${query}`, {
    method: "HEAD",
    headers: { ...publicHeaders, Prefer: "count=exact" },
  });
  if (!response.ok) throw new Error(`deals HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const contentRange = response.headers.get("content-range") ?? "*/0";
  const total = Number(contentRange.split("/").at(-1));
  if (!Number.isFinite(total)) throw new Error(`deals response did not include an exact count: ${contentRange}`);
  return total;
}

for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
  console.log(`Live pipeline cycle ${cycle}/${maxCycles}: scanning provider data.`);
  const batchNumber = cycle - 1;
  const scan = await invoke("flight-scanner", "POST", {
    routeIndex: Math.floor(batchNumber / 4) % routeBatchCount,
    routeCount: routeBatchCount,
    offsetIndex: batchNumber % 4,
    offsetCount: 4,
    forceRefresh,
  });
  const analysis = await invoke("analyze-price");
  let feed;
  try { feed = await invoke("feed-snapshot", "GET"); } catch (error) {
    console.error(`Feed snapshot did not complete: ${error instanceof Error ? error.message : String(error)}`);
  }
  const hotDeals = await countHotDeals();
  console.log(JSON.stringify({ cycle, observationsSaved: scan.observations_saved ?? 0, publishedThisCycle: analysis.deals_published ?? 0, feedSource: feed?.source ?? "unavailable", hotDeals, targetDeals, thresholds: { hotScore, hotDiscount, hotConfidence } }));
  if (hotDeals >= targetDeals) {
    console.log(`Live pipeline succeeded with ${hotDeals} real hot deals.`);
    process.exit(0);
  }
  if (cycle < maxCycles) await new Promise((resolve) => setTimeout(resolve, cycleDelayMs));
}

console.error(`Live pipeline stopped without reaching target: fewer than ${targetDeals} real hot deals after ${maxCycles} cycles.`);
process.exit(allowBelowTarget ? 0 : 1);
