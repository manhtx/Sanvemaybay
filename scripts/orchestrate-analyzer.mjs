// @ts-check
import { env } from "node:process";

const baseUrl = (env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
const anonKey = (env.VITE_SUPABASE_ANON_KEY || "").trim();
const secret = (env.INTERNAL_FUNCTION_SECRET || "").trim();

if (!baseUrl || !anonKey || !secret) {
  console.error("Missing required environment variables for analyzer orchestration.");
  process.exit(1);
}

const endpoint = `${baseUrl}/functions/v1/analyze-price`;
const maxBatches = 20;

let batch = 1;
let continuation = null;
let totalProcessed = 0;
let totalHistory = 0;
let totalDeals = 0;
let hasMore = true;

console.log(`Starting analyzer orchestration loop (max ${maxBatches} batches)...`);

while (hasMore && batch <= maxBatches) {
  console.log(`Executing analyzer batch ${batch}...`);
  const body = continuation ? continuation : {};

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`,
      "x-internal-secret": secret,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error(`Analyzer failed on batch ${batch} with status ${res.status}: ${errorText}`);
    process.exit(1);
  }

  const payload = await res.json();
  const processed = payload.observations_processed || 0;
  const history = payload.price_history_saved || 0;
  const deals = payload.deals_published || 0;

  totalProcessed += processed;
  totalHistory += history;
  totalDeals += deals;

  console.log(`Batch ${batch} completed: ${processed} processed, ${history} history rows, ${deals} deals published.`);

  hasMore = Boolean(payload.has_more);
  continuation = payload.continuation || null;

  if (!hasMore || !continuation) {
    console.log(
      `Analyzer fully completed after ${batch} batch(es). Total: ${totalProcessed} processed, ${totalHistory} history rows, ${totalDeals} deals published.`
    );
    break;
  }


  batch++;
}

if (hasMore) {
  console.warn(`Analyzer reached batch limit (${maxBatches}) with more records pending. Status: PARTIAL_CONTINUATION.`);
}
