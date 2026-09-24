import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientAddress, consumeRequestBudget, hashRateLimitKey } from "../_shared/abuse-protection.ts";
import { validateProductEvent } from "../_shared/product-event.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const event = validateProductEvent(await request.json());
    if (!event) return json({ error: "Invalid event" }, 400);

    const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
    const address = clientAddress(request);
    if (salt.length < 16 || !address) return json({ error: "Analytics unavailable" }, 503);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const bucket = await hashRateLimitKey("product-event-ip", address, salt);
    const allowed = await consumeRequestBudget(supabase, "track-product-event", bucket, 120, 3_600);
    if (!allowed) return json({ error: "Rate limit exceeded" }, 429);

    const { error } = await supabase.from("product_events").insert({ ...event, user_id: null });
    if (error) return json({ error: "Analytics unavailable" }, 503);
    return json({ accepted: true }, 202);
  } catch {
    return json({ error: "Invalid event" }, 400);
  }
});
