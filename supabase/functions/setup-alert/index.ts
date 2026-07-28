import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ]!,
  );
}

function createToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const {
      email,
      destination,
      destination_code,
      origin_code,
      budget,
      channel,
      telegram_id,
      discount_threshold,
      preferred_regions,
      frequency,
    } = body;

    if (!isEmail(email)) return json({ error: "Email không hợp lệ." }, 400);
    if (typeof destination !== "string" || !destination.trim()) {
      return json({ error: "Điểm đến không hợp lệ." }, 400);
    }
    if (!/^[A-Z]{3}$/.test(origin_code ?? "") || !/^[A-Z]{3}$/.test(destination_code ?? "")) {
      return json({ error: "Mã sân bay không hợp lệ." }, 400);
    }
    if (channel === "telegram" && !/^-?\d+$/.test(telegram_id ?? "")) {
      return json({ error: "Telegram Chat ID không hợp lệ." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const normalizedEmail = email.toLowerCase().trim();
    const { data: trackedRoute, error: routeError } = await supabase
      .from("tracked_routes")
      .select("id, destination_name")
      .eq("origin_code", origin_code)
      .eq("destination_code", destination_code)
      .eq("enabled", true)
      .maybeSingle();
    if (routeError) return json({ error: routeError.message }, 500);
    if (!trackedRoute) {
      return json({ error: "Tuyến bay này chưa được hệ thống theo dõi." }, 400);
    }
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("user_alerts")
      .select("id", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", oneHourAgo);
    if (countError) return json({ error: countError.message }, 500);
    if ((count ?? 0) >= 5) {
      return json({ error: "Bạn đã tạo quá nhiều cảnh báo. Vui lòng thử lại sau một giờ." }, 429);
    }

    const publicSiteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET");
    if (!publicSiteUrl || !resendKey || !unsubscribeSecret) {
      return json({ error: "Dịch vụ email xác nhận chưa được cấu hình." }, 503);
    }
    const confirmationToken = createToken();
    const confirmationTokenHash = await hashToken(confirmationToken);

    const { data: alert, error: dbError } = await supabase
      .from("user_alerts")
      .insert({
        email: normalizedEmail,
        destination: trackedRoute.destination_name,
        destination_code: destination_code || null,
        origin_code: origin_code || null,
        budget: Number.isFinite(Number(budget)) ? Number(budget) : null,
        discount_threshold: Number.isFinite(Number(discount_threshold))
          ? Number(discount_threshold)
          : 20,
        preferred_regions: Array.isArray(preferred_regions) ? preferred_regions : [],
        frequency: frequency === "daily" ? "daily" : "instant",
        notify_email: true,
        notify_telegram: channel === "telegram",
        telegram_id: channel === "telegram" ? telegram_id : null,
        status: "pending_confirmation",
        confirmation_token_hash: confirmationTokenHash,
        confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (dbError) return json({ error: `Không thể lưu cảnh báo: ${dbError.message}` }, 500);

    const unsubscribeSignature = await signAlertId(alert.id, unsubscribeSecret);
    const confirmationUrl = `${publicSiteUrl}/alerts/confirm?token=${encodeURIComponent(confirmationToken)}`;
    const unsubscribeUrl = `${publicSiteUrl}/alerts/unsubscribe?id=${encodeURIComponent(alert.id)}&signature=${unsubscribeSignature}`;
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("ALERT_FROM_EMAIL") ?? "FlyCheap Alerts <alerts@resend.dev>",
          to: [email],
          subject: `Xác nhận cảnh báo giá vé đi ${trackedRoute.destination_name}`,
          html: `<h2>Xác nhận cảnh báo giá</h2>
            <p>Điểm đến: <strong>${escapeHtml(trackedRoute.destination_name)}</strong></p>
            <p>Ngân sách: <strong>${budget ? Number(budget).toLocaleString("vi-VN") + " VND" : "Không giới hạn"}</strong></p>
            <p><a href="${confirmationUrl}">Xác nhận cảnh báo</a> (liên kết có hiệu lực 24 giờ).</p>
            <p>Cảnh báo chỉ hoạt động sau khi bạn xác nhận.</p>
            <p><a href="${unsubscribeUrl}">Hủy đăng ký</a></p>`,
        }),
      });
    if (!response.ok) {
      await supabase.from("user_alerts").delete().eq("id", alert.id);
      return json({ error: "Không thể gửi email xác nhận. Cảnh báo chưa được tạo." }, 502);
    }

    return json({
      success: true,
      alert_id: alert.id,
      status: "pending_confirmation",
      confirmation_sent: true,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
  }
});
