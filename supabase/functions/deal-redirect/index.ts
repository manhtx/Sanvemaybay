import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

function validHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  const dealId = new URL(request.url).searchParams.get("deal_id") ?? "";
  if (!dealId) return json({ error: "deal_id is required" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: deal, error } = await supabase
    .from("deals")
    .select("booking_url,affiliate_url,affiliate_network,link_kind,valid_until")
    .eq("id", dealId)
    .maybeSingle();
  if (error) return json({ error: "Deal redirect unavailable" }, 503);
  if (!deal || !deal.valid_until || Date.parse(deal.valid_until) <= Date.now()) {
    return json({ error: "Deal has expired" }, 410);
  }

  const isAffiliate = deal.link_kind === "live_affiliate" &&
    typeof deal.affiliate_network === "string" && deal.affiliate_network.trim() &&
    validHttpsUrl(deal.affiliate_url);
  const target = isAffiliate ? deal.affiliate_url : deal.booking_url;
  if (!validHttpsUrl(target)) return json({ error: "No verified booking link" }, 404);

  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "no-store" },
  });
});
