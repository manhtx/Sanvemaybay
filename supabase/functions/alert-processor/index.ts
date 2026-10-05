import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { matchesAlert, selectDailyDeal } from "../_shared/alert-matching.ts";
import { nextNotificationRetry } from "../_shared/retry-policy.ts";
import { approvedBookingHosts, isActiveLiveDeal } from "../_shared/live-deal.ts";
import { safeOperationalErrorCode } from "../_shared/observability.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ]!,
  );
}

async function signAlertId(alertId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(alertId));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendEmail(alert: any, deal: any): Promise<string> {
  const key = Deno.env.get("RESEND_API_KEY");
  const publicSiteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "");
  const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET") ?? "";
  if (!key || !alert.email || !publicSiteUrl || !unsubscribeSecret) {
    throw new Error("Email provider is not configured.");
  }
  const signature = await signAlertId(alert.id, unsubscribeSecret);
  const unsubscribeUrl = `${publicSiteUrl}/alerts/unsubscribe?id=${encodeURIComponent(alert.id)}&signature=${signature}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: Deno.env.get("ALERT_FROM_EMAIL") ?? "FlyCheap Alerts <alerts@resend.dev>",
      to: [alert.email],
      subject: `Deal ${deal.from_code} → ${deal.to_code}: ${Number(deal.price).toLocaleString("vi-VN")} VND`,
      html: `<h2>Phát hiện giá phù hợp</h2>
        <p>${escapeHtml(deal.from)} → ${escapeHtml(deal.to)}</p>
        <p><strong>${Number(deal.price).toLocaleString("vi-VN")} VND</strong> — thấp hơn ${deal.discount}% so với giá tham chiếu.</p>
        <p>Dữ liệu được kiểm tra lúc ${escapeHtml(deal.observed_at ?? deal.updated_at)}.</p>
        <p><a href="${unsubscribeUrl}">Hủy nhận cảnh báo này</a></p>`,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? "Resend rejected the message.");
  return payload.id;
}

async function sendTelegram(alert: any, deal: any): Promise<string> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token || !alert.telegram_id) throw new Error("Telegram provider is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: alert.telegram_id,
      text: `🔥 ${deal.from_code} → ${deal.to_code}\n${Number(deal.price).toLocaleString("vi-VN")} VND (-${deal.discount}%)`,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.description ?? "Telegram rejected the message.");
  return String(payload.result.message_id);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const [
      { data: alerts, error: alertError },
      { data: deals, error: dealError },
      { data: observedSnapshots, error: observedError },
    ] = await Promise.all([
      supabase.from("user_alerts").select("*").eq("status", "active"),
      supabase
        .from("deals")
        .select("*")
        .gte("depart_date", new Date().toISOString().slice(0, 10))
        .gt("valid_until", new Date().toISOString())
        .gte("observed_at", new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("observed_fare_snapshots")
        .select("*")
        .gte("depart_date", new Date().toISOString().slice(0, 10))
        .gte("observed_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order("deal_score", { ascending: false })
        .limit(500),
    ]);
    if (alertError) throw alertError;
    if (dealError) throw dealError;
    if (observedError) {
      console.warn("Notice: observed_fare_snapshots query returned:", observedError.message);
    }

    let sent = 0;
    let failed = 0;

    const bookingHosts = approvedBookingHosts(Deno.env.get("APPROVED_BOOKING_HOSTS"));
    const activeDeals = (deals ?? []).filter((deal) => isActiveLiveDeal(deal, bookingHosts)).map((deal) => ({
      ...deal,
      is_observed: false,
      opportunity_id: deal.id,
    }));

    const activeObserved = (observedSnapshots ?? []).map((row) => ({
      id: row.dedupe_key,
      opportunity_id: row.dedupe_key,
      is_observed: true,
      from: row.origin,
      from_code: row.origin_code,
      to: row.destination,
      to_code: row.destination_code,
      price: Number(row.price),
      discount: Number(row.discount_percent ?? 0),
      trip_type: row.region === "domestic" ? "domestic" : "international",
      deal_score: Number(row.deal_score ?? 0),
      depart_date: row.depart_date,
      booking_url: row.booking_url,
      observed_at: row.observed_at,
      airline: row.airline,
      airline_code: row.airline_code,
      stops: row.stops,
    }));

    const allCandidates = [...activeDeals, ...activeObserved];

    for (const alert of alerts ?? []) {
      let matchingDeals = allCandidates.filter((deal) => matchesAlert(alert, deal));

      if (alert.target_price != null && Number(alert.target_price) > 0) {
        matchingDeals = matchingDeals.filter((deal) => Number(deal.price) <= Number(alert.target_price));
      }

      if (alert.max_stops != null && alert.max_stops >= 0) {
        matchingDeals = matchingDeals.filter((deal) => deal.stops == null || Number(deal.stops) <= Number(alert.max_stops));
      }

      const nowIso = new Date().toISOString();
      if (matchingDeals.length > 0) {
        const sortedByPrice = [...matchingDeals].sort((a, b) => Number(a.price) - Number(b.price));
        const bestCandidate = sortedByPrice[0];
        await supabase.from("user_alerts").update({
          last_checked_at: nowIso,
          last_match_at: nowIso,
          latest_price: Number(bestCandidate.price),
        }).eq("id", alert.id);
      } else {
        await supabase.from("user_alerts").update({
          last_checked_at: nowIso,
        }).eq("id", alert.id);
      }

      if (alert.frequency === "daily") {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const { count, error: deliveryCountError } = await supabase
          .from("notification_deliveries")
          .select("id", { count: "exact", head: true })
          .eq("alert_id", alert.id)
          .eq("status", "sent")
          .gte("created_at", today.toISOString());
        if (deliveryCountError) throw deliveryCountError;
        if ((count ?? 0) > 0) continue;
        matchingDeals = selectDailyDeal(matchingDeals);
      }

      for (const deal of matchingDeals) {
        const channels = [
          alert.notify_email && { name: "email", send: () => sendEmail(alert, deal) },
          alert.notify_telegram && { name: "telegram", send: () => sendTelegram(alert, deal) },
        ].filter(Boolean) as Array<{ name: "email" | "telegram"; send: () => Promise<string> }>;

        for (const channel of channels) {
          let deliveryQuery = supabase
            .from("notification_deliveries")
            .select("id,status,attempt_count,next_retry_at")
            .eq("alert_id", alert.id)
            .eq("channel", channel.name);

          if (deal.is_observed) {
            deliveryQuery = deliveryQuery.eq("opportunity_id", deal.opportunity_id);
          } else {
            deliveryQuery = deliveryQuery.eq("deal_id", deal.id);
          }

          const { data: existing } = await deliveryQuery.maybeSingle();
          if (existing?.status === "sent") continue;
          if (existing?.status === "failed" && Number(existing.attempt_count ?? 0) >= 3) continue;
          if (existing?.status === "failed" && existing.next_retry_at && new Date(existing.next_retry_at) > new Date()) continue;

          const deliveryPayload = {
            alert_id: alert.id,
            deal_id: deal.is_observed ? null : deal.id,
            opportunity_id: deal.is_observed ? deal.opportunity_id : null,
            channel: channel.name,
            created_at: new Date().toISOString(),
          };

          const onConflict = deal.is_observed ? "alert_id,opportunity_id,channel" : "alert_id,deal_id,channel";

          try {
            const providerId = await channel.send();
            await supabase.from("notification_deliveries").upsert({
              ...deliveryPayload,
              status: "sent",
              provider_message_id: providerId,
              error_message: null,
              attempt_count: Number(existing?.attempt_count ?? 0),
              next_retry_at: null,
            }, { onConflict });
            sent++;
          } catch (error) {
            const retry = nextNotificationRetry(Number(existing?.attempt_count ?? 0));
            await supabase.from("notification_deliveries").upsert({
              ...deliveryPayload,
              status: "failed",
              error_message: safeOperationalErrorCode(error, "delivery_failed"),
              attempt_count: retry.attemptCount,
              next_retry_at: retry.nextRetryAt ?? null,
            }, { onConflict });
            failed++;
          }
        }
      }
    }

    return json({ success: true, sent, failed });
  } catch (error) {
    return json({ error: "Alert processing failed", error_code: safeOperationalErrorCode(error) }, 500);
  }
});
