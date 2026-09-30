/* global process, console, fetch, URL */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const LIVE_KINDS = new Set(["live_source", "live_affiliate"]);

function readDotEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
        }),
    );
  } catch {
    return {};
  }
}

function csvSet(value) {
  return new Set(String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean));
}

function isApprovedHttpsUrl(value, approvedHosts) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && [...approvedHosts].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function rejectionReasons(deal, config) {
  const reasons = [];
  const now = config.now;
  const route = `${deal.from_code}-${deal.to_code}`;
  if (!config.launchRoutes.has(route)) reasons.push("outside_launch_cohort");
  if (!config.approvedSources.has(deal.source)) reasons.push("unapproved_source");
  if (!LIVE_KINDS.has(deal.link_kind)) reasons.push("not_live_kind");
  if (!(new Date(`${deal.depart_date}T00:00:00Z`) > now)) reasons.push("departure_not_future");
  if (!(new Date(deal.valid_until) > now)) reasons.push("expired_or_missing_validity");
  if (!(Number(deal.price) > 0)) reasons.push("invalid_price");
  if (!String(deal.duration ?? "").trim()) reasons.push("missing_duration");
  if (!isApprovedHttpsUrl(deal.booking_url, config.approvedHosts)) reasons.push("invalid_booking_url");
  if (deal.link_kind === "live_affiliate") {
    if (!String(deal.affiliate_network ?? "").trim()) reasons.push("missing_affiliate_network");
    if (!isApprovedHttpsUrl(deal.affiliate_url, config.approvedHosts)) reasons.push("invalid_affiliate_url");
  }
  if (!(Number(deal.deal_score) >= config.minScore)) reasons.push("below_score_threshold");
  if (!(Number(deal.discount) >= config.minDiscount)) reasons.push("below_discount_threshold");
  if (!(Number(deal.confidence) >= config.minConfidence)) reasons.push("below_confidence_threshold");
  return reasons;
}

export function summarizeDeals(deals, config) {
  const rejectionCounts = {};
  const sourceCounts = {};
  const qualified = [];
  for (const deal of deals) {
    sourceCounts[deal.source ?? "missing"] = (sourceCounts[deal.source ?? "missing"] ?? 0) + 1;
    const reasons = rejectionReasons(deal, config);
    if (reasons.length === 0) qualified.push(deal);
    for (const reason of reasons) rejectionCounts[reason] = (rejectionCounts[reason] ?? 0) + 1;
  }
  return {
    totalRows: deals.length,
    qualifiedLiveDeals: qualified.length,
    launchCohortRows: deals.filter((deal) => config.launchRoutes.has(`${deal.from_code}-${deal.to_code}`)).length,
    sourceCounts,
    rejectionCounts,
    qualifiedIds: qualified.map((deal) => deal.id),
  };
}

async function main() {
  const dotEnv = readDotEnv(".env");
  const env = { ...dotEnv, ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  const launchRoutes = csvSet(env.LIVE_LAUNCH_ROUTES);
  const approvedSources = csvSet(env.APPROVED_LIVE_SOURCES);
  const approvedHosts = csvSet(env.APPROVED_BOOKING_HOSTS);
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required");
  if (launchRoutes.size === 0 || launchRoutes.size > 5) throw new Error("LIVE_LAUNCH_ROUTES must contain 1-5 ORIGIN-DESTINATION pairs");
  if (approvedSources.size === 0) throw new Error("APPROVED_LIVE_SOURCES must list at least one contract-approved source");
  if (approvedHosts.size === 0) throw new Error("APPROVED_BOOKING_HOSTS must list at least one approved provider host");

  const select = ["id", "from_code", "to_code", "depart_date", "price", "duration", "discount", "confidence", "deal_score", "source", "valid_until", "booking_url", "link_kind", "affiliate_network", "affiliate_url"].join(",");
  const response = await fetch(`${url}/rest/v1/deals?select=${encodeURIComponent(select)}&limit=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 500);
    throw new Error(`deals returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  const deals = await response.json();
  if (!Array.isArray(deals)) throw new Error("deals response is not an array");

  const summary = summarizeDeals(deals, {
    now: new Date(),
    launchRoutes,
    approvedSources,
    approvedHosts,
    minScore: Number(env.HOT_DEAL_SCORE ?? 80),
    minDiscount: Number(env.HOT_DEAL_DISCOUNT ?? 20),
    minConfidence: Number(env.HOT_DEAL_CONFIDENCE ?? 0.65),
  });
  const isStandby = env.ALLOW_INDICATIVE_STANDBY === "true";
  console.log(JSON.stringify({ ok: summary.qualifiedLiveDeals > 0 || isStandby, ...summary }));
  if (summary.qualifiedLiveDeals === 0 && !isStandby) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
