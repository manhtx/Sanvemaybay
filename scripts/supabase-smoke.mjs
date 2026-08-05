/* global process, console, fetch */

import { readFileSync } from "node:fs";

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

const dotEnv = readDotEnv(".env");
const url = process.env.VITE_SUPABASE_URL ?? dotEnv.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY ?? dotEnv.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Supabase smoke test requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(2);
}

async function query(table, select) {
  const response = await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`${table} returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error(`${table} response is not an array`);
  return payload;
}

const routes = await query("tracked_routes", "id,origin_code,destination_code,enabled");
const deals = await query("deals", "id,from_code,to_code,price,deal_score,valid_until");
if (routes.some((route) => typeof route.id !== "string" || typeof route.enabled !== "boolean")) {
  throw new Error("tracked_routes response contains an invalid row");
}
if (deals.some((deal) => typeof deal.id !== "string" || typeof deal.price !== "number")) {
  throw new Error("deals response contains an invalid row");
}

console.log(JSON.stringify({ ok: true, trackedRoutes: routes.length, publishedDeals: deals.length }));
