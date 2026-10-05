import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { operationalFields, operationalHeaders, requestId } from "../_shared/observability.ts";
import { accountDeletionLogId, isAccountDeletionConfirmed, safeUserDataErrorCode } from "../_shared/user-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
};

function json(body: Record<string, unknown>, id: string, status = 200) {
  return new Response(JSON.stringify({ ...body, ...operationalFields(id) }), {
    status,
    headers: { ...corsHeaders, ...operationalHeaders(id), "Content-Type": "application/json" },
  });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

Deno.serve(async (request: Request) => {
  const id = requestId(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, id, 405);

  const token = bearerToken(request);
  if (!token) return json({ error: "Authentication required" }, id, 401);
  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: authData, error: authError } = await service.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Invalid session" }, id, 401);
  const user = authData.user;
  const userLogId = await accountDeletionLogId(user.id);

  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (body.action === "export") {
      const [preferences, bookmarks, savedOpportunities, alerts, events] = await Promise.all([
        service.from("user_preferences").select("budget_max,preferred_regions,alert_frequency,excluded_airlines,home_airport,max_stops,preferred_airlines,cabin_class,max_flight_time_minutes,allow_self_transfer,updated_at").eq("user_id", user.id),
        service.from("user_bookmarks").select("deal_id,created_at").eq("user_id", user.id),
        service.from("user_saved_opportunities").select("opportunity_id,snapshot_data,saved_at").eq("user_id", user.id),
        service.from("user_alerts").select("id,destination,budget,target_price,latest_price,max_stops,last_checked_at,last_match_at,notify_telegram,telegram_id,notify_email,created_at,email,origin_code,destination_code,discount_threshold,preferred_regions,frequency,status,updated_at,date_from,date_to,confirmed_at").eq("user_id", user.id),
        service.from("product_events").select("event_type,entity_id,metadata,created_at").eq("user_id", user.id),
      ]);
      const firstError = [preferences.error, bookmarks.error, savedOpportunities.error, alerts.error, events.error].find(Boolean);
      if (firstError) throw firstError;
      const alertIds = (alerts.data ?? []).map((alert) => alert.id);
      const deliveries = alertIds.length
        ? await service.from("notification_deliveries").select("alert_id,deal_id,opportunity_id,channel,status,created_at").in("alert_id", alertIds)
        : { data: [], error: null };
      if (deliveries.error) throw deliveries.error;
      return json({
        export: {
          generated_at: new Date().toISOString(),
          account: { id: user.id, email: user.email ?? null, created_at: user.created_at },
          preferences: preferences.data ?? [],
          bookmarks: bookmarks.data ?? [],
          saved_opportunities: savedOpportunities.data ?? [],
          alerts: alerts.data ?? [],
          notification_deliveries: deliveries.data ?? [],
          product_events: events.data ?? [],
        },
      }, id);
    }

    if (body.action === "delete") {
      if (!isAccountDeletionConfirmed(body.confirmation)) {
        return json({ error: "Explicit deletion confirmation required" }, id, 400);
      }
      const { error: deletionError } = await service.rpc("prepare_account_deletion", {
        p_user_id: user.id,
      });
      if (deletionError) throw deletionError;
      const { error: accountError } = await service.auth.admin.deleteUser(user.id, false);
      if (accountError) {
        await service.from("account_deletion_requests").update({
          status: "auth_delete_failed",
          updated_at: new Date().toISOString(),
          last_error_code: "auth_delete_failed",
        }).eq("user_id", user.id);
        throw accountError;
      }
      const { error: completionError } = await service.from("account_deletion_requests").update({
        status: "completed",
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        last_error_code: null,
      }).eq("user_id", user.id);
      if (completionError) {
        console.error(JSON.stringify({ event: "account_deletion_completion_record_failed", request_id: id, user_ref: userLogId }));
      }
      return json({ deleted: true }, id);
    }

    return json({ error: "Unsupported action" }, id, 400);
  } catch (error) {
    console.error(JSON.stringify({ event: "user_data_action_failed", request_id: id, user_ref: userLogId, error_code: safeUserDataErrorCode(error) }));
    return json({ error: "User data action failed" }, id, 500);
  }
});
