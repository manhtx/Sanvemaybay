import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FEED_SNAPSHOT_KEY, shouldRefreshSnapshot } from "../_shared/feed-snapshot.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  try {
    const { data: snapshot } = await supabase
      .from("feed_snapshots")
      .select("payload, generated_at")
      .eq("snapshot_key", FEED_SNAPSHOT_KEY)
      .maybeSingle();
    if (snapshot && !shouldRefreshSnapshot(snapshot.generated_at)) {
      return response({ deals: snapshot.payload, source: "snapshot", generated_at: snapshot.generated_at });
    }

    const { data: deals, error } = await supabase
      .from("deals")
      .select("*")
      .gte("depart_date", new Date().toISOString().slice(0, 10))
      .gt("valid_until", new Date().toISOString())
      .order("deal_score", { ascending: false });
    if (error) throw error;
    const generatedAt = new Date().toISOString();
    const { error: writeError } = await supabase.from("feed_snapshots").upsert({
      snapshot_key: FEED_SNAPSHOT_KEY,
      payload: deals ?? [],
      generated_at: generatedAt,
    });
    if (writeError) console.error("Feed snapshot write failed", writeError);
    return response({ deals: deals ?? [], source: "live", generated_at: generatedAt });
  } catch (error) {
    console.error("Feed snapshot refresh failed", error);
    const { data: stale } = await supabase
      .from("feed_snapshots")
      .select("payload, generated_at")
      .eq("snapshot_key", FEED_SNAPSHOT_KEY)
      .maybeSingle();
    if (stale) return response({ deals: stale.payload, source: "stale_snapshot", generated_at: stale.generated_at });
    return response({ deals: [], source: "empty", error: "Feed is unavailable." }, 503);
  }
});
