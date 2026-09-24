import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FEED_SNAPSHOT_KEY, shouldRefreshSnapshot } from "../_shared/feed-snapshot.ts";
import { approvedBookingHosts, isActiveLiveDeal } from "../_shared/live-deal.ts";
import { classifyFeedStatus, feedEnvelope, isSchemaContractError } from "../_shared/feed-health.ts";
import { operationalFields, operationalHeaders, requestId, safeOperationalErrorCode } from "../_shared/observability.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
};

function response(body: unknown, id: string, status = 200): Response {
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? { ...body as Record<string, unknown>, ...operationalFields(id) }
    : body;
  return new Response(JSON.stringify(payload), { status, headers: { ...headers, ...operationalHeaders(id) } });
}

Deno.serve(async (request) => {
  const id = requestId(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers: { ...headers, ...operationalHeaders(id) } });
  let forceRefresh = false;
  try {
    const body = await request.json();
    forceRefresh = body?.force_refresh === true;
  } catch {
    // Empty public requests read the cached snapshot as usual.
  }
  if (forceRefresh) {
    const configuredSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
    const suppliedSecret = request.headers.get("x-internal-secret") ?? "";
    if (!configuredSecret || suppliedSecret !== configuredSecret) {
      return response({ error: "Unauthorized" }, id, 401);
    }
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const bookingHosts = approvedBookingHosts(Deno.env.get("APPROVED_BOOKING_HOSTS"));
  try {
    const { error: schemaError } = await supabase
      .from("deals")
      .select("id,link_kind")
      .limit(1);
    if (schemaError) {
      const status = isSchemaContractError(schemaError) ? "degraded_schema" : "provider_unavailable";
      return response(feedEnvelope(status, [], "schema_check"), id, 503);
    }

    const { data: snapshot } = await supabase
      .from("feed_snapshots")
      .select("payload, generated_at")
      .eq("snapshot_key", FEED_SNAPSHOT_KEY)
      .maybeSingle();
    if (snapshot && !forceRefresh && !shouldRefreshSnapshot(snapshot.generated_at)) {
      const activeDeals = Array.isArray(snapshot.payload)
        ? snapshot.payload.filter((deal) => isActiveLiveDeal(deal, bookingHosts))
        : [];
      const totalRows = Array.isArray(snapshot.payload) ? snapshot.payload.length : 0;
      const status = classifyFeedStatus(totalRows, activeDeals.length);
      return response(feedEnvelope(status, activeDeals, "snapshot", snapshot.generated_at), id);
    }

    const { data: deals, error } = await supabase
      .from("deals")
      .select("*")
      .gte("depart_date", new Date().toISOString().slice(0, 10))
      .gt("valid_until", new Date().toISOString())
      .order("deal_score", { ascending: false });
    if (error) throw error;
    const activeDeals = (deals ?? []).filter((deal) => isActiveLiveDeal(deal, bookingHosts));
    const generatedAt = new Date().toISOString();
    const { error: writeError } = await supabase.from("feed_snapshots").upsert({
      snapshot_key: FEED_SNAPSHOT_KEY,
      payload: activeDeals,
      generated_at: generatedAt,
    });
    if (writeError) console.error(JSON.stringify({ event: "feed_snapshot_write_failed", request_id: id, error_code: safeOperationalErrorCode(writeError) }));
    const status = classifyFeedStatus((deals ?? []).length, activeDeals.length);
    return response(feedEnvelope(status, activeDeals, "live", generatedAt), id);
  } catch (error) {
    console.error(JSON.stringify({ event: "feed_snapshot_refresh_failed", request_id: id, error_code: safeOperationalErrorCode(error) }));
    const { data: stale } = await supabase
      .from("feed_snapshots")
      .select("payload, generated_at")
      .eq("snapshot_key", FEED_SNAPSHOT_KEY)
      .maybeSingle();
    if (stale) {
      const activeDeals = Array.isArray(stale.payload)
        ? stale.payload.filter((deal) => isActiveLiveDeal(deal, bookingHosts))
        : [];
      if (activeDeals.length > 0) {
        return response(feedEnvelope("stale_only", activeDeals, "stale_snapshot", stale.generated_at), id);
      }
    }
    return response(feedEnvelope("provider_unavailable", [], "feed_error"), id, 503);
  }
});
