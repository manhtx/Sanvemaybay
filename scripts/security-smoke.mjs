/* global process, console, fetch */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function readDotEnv(path) {
  try {
    return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }));
  } catch {
    return {};
  }
}

export function isProtectedReadResult(status, payload, allowMissing = false) {
  if ([401, 403].includes(status)) return true;
  if (status === 404) return allowMissing;
  return status === 200 && Array.isArray(payload) && payload.length === 0;
}

export const PROTECTED_TABLES = [
  "flights",
  "scan_runs",
  "user_alerts",
  "user_preferences",
  "user_bookmarks",
  "notification_deliveries",
  "product_events",
  "request_rate_limits",
  "observed_fare_snapshots",
  "account_deletion_requests",
  "operational_scan_health",
];

async function requestTable(url, key, table, select = "*") {
  const response = await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  let payload;
  try { payload = await response.json(); } catch { payload = undefined; }
  return { status: response.status, payload };
}

async function main() {
  const env = { ...readDotEnv(".env"), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  const allowMissing = env.SECURITY_ALLOW_MISSING_TABLES === "true";
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required");

  const publicCatalog = await requestTable(url, key, "tracked_routes", "id");
  if (publicCatalog.status !== 200 || !Array.isArray(publicCatalog.payload) || publicCatalog.payload.length === 0) {
    throw new Error("Public tracked-route catalog is unavailable");
  }

  const results = {};
  for (const table of PROTECTED_TABLES) {
    const result = await requestTable(url, key, table);
    results[table] = result.status;
    if (!isProtectedReadResult(result.status, result.payload, allowMissing)) {
      throw new Error(`Protected table boundary failed for ${table} (HTTP ${result.status})`);
    }
  }
  console.log(JSON.stringify({ ok: true, publicCatalog: true, protectedTables: results }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
