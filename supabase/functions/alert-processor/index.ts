import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const [{ data: alerts, error: alertError }, { data: deals, error: dealError }] =
      await Promise.all([
        supabase.from("user_alerts").select("*").eq("status", "active"),
        supabase
          .from("deals")
          .select("*")
          .gte("depart_date", new Date().toISOString().slice(0, 10))
          .gt("valid_until", new Date().toISOString())
          .gte("observed_at", new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()),
      ]);
    if (alertError) throw alertError;
    if (dealError) throw dealError;

    let sent = 0;
    let failed = 0;

    for (const alert of alerts ?? []) {
      const matchingDeals = (deals ?? []).filter((deal) => {
        const destinationMatches =
          alert.destination_code
            ? alert.destination_code === deal.to_code
            : alert.destination === deal.to;
        const originMatches = !alert.origin_code || alert.origin_code === deal.from_code;
        const budgetMatches = !alert.budget || Number(deal.price) <= Number(alert.budget);
        const discountMatches = Number(deal.discount) >= Number(alert.discount_threshold ?? 0);
        const regionMatches =
          !alert.preferred_regions?.length ||
          (deal.trip_type === "domestic"
            ? alert.preferred_regions.includes("Domestic")
            : alert.preferred_regions.includes("International"));
        return destinationMatches && originMatches && budgetMatches && discountMatches && regionMatches;
      });

      if (alert.frequency === "daily") {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("notification_deliveries")
          .select("id", { count: "exact", head: true })
          .eq("alert_id", alert.id)
          .eq("status", "sent")
          .gte("created_at", today.toISOString());
        if ((count ?? 0) > 0) continue;
        matchingDeals.sort((a, b) => Number(b.deal_score ?? 0) - Number(a.deal_score ?? 0));
        matchingDeals.splice(1);
      }

      for (const deal of matchingDeals) {

        const channels = [
          alert.notify_email && { name: "email", send: () => sendEmail(alert, deal) },
          alert.notify_telegram && { name: "telegram", send: () => sendTelegram(alert, deal) },
        ].filter(Boolean) as Array<{ name: "email" | "telegram"; send: () => Promise<string> }>;

        for (const channel of channels) {
          const { data: existing } = await supabase
            .from("notification_deliveries")
            .select("id,status")
            .eq("alert_id", alert.id)
            .eq("deal_id", deal.id)
            .eq("channel", channel.name)
            .maybeSingle();
          if (existing?.status === "sent") continue;

          try {
            const providerId = await channel.send();
            await supabase.from("notification_deliveries").upsert({
              alert_id: alert.id,
              deal_id: deal.id,
              channel: channel.name,
              status: "sent",
              provider_message_id: providerId,
              error_message: null,
              created_at: new Date().toISOString(),
            }, { onConflict: "alert_id,deal_id,channel" });
            sent++;
          } catch (error) {
            await supabase.from("notification_deliveries").upsert({
              alert_id: alert.id,
              deal_id: deal.id,
              channel: channel.name,
              status: "failed",
              error_message: error instanceof Error ? error.message : "Unknown delivery error",
              created_at: new Date().toISOString(),
            }, { onConflict: "alert_id,deal_id,channel" });
            failed++;
          }
        }
      }
    }

    return json({ success: true, sent, failed });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown processor error" }, 500);
  }
});
