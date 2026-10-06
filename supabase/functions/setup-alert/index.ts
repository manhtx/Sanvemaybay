import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAlertInput } from "../_shared/alert-validation.ts";
import { clientAddress, consumeRequestBudget, hashRateLimitKey } from "../_shared/abuse-protection.ts";
import { verifyTurnstileToken } from "../_shared/turnstile.ts";

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
    const body = await req.json() as Record<string, unknown>;
    const requests = Array.isArray(body.alerts) ? body.alerts : [];
    if (requests.length < 1 || requests.length > 5) {
      return json({ error: "Mỗi lần có thể tạo từ 1 đến 5 cảnh báo." }, 400);
    }
    for (const candidate of requests) {
      const validationError = validateAlertInput(candidate);
      if (validationError) return json({ error: validationError }, 400);
    }
    const emails = new Set(requests.map((candidate) => String(candidate.email).toLowerCase().trim()));
    if (emails.size !== 1) return json({ error: "Các cảnh báo trong cùng một lượt phải dùng chung email." }, 400);
    const normalizedEmail = [...emails][0];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
    const address = clientAddress(req);
    if (rateLimitSalt.length < 16 || !address) {
      return json({ error: "Dịch vụ chống lạm dụng chưa được cấu hình." }, 503);
    }
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
    const turnstileHostnames = new Set((Deno.env.get("TURNSTILE_ALLOWED_HOSTNAMES") ?? "")
      .split(",").map((hostname) => hostname.trim().toLowerCase()).filter(Boolean));
    if (!turnstileSecret || turnstileHostnames.size === 0) return json({ error: "Dịch vụ xác minh chưa được cấu hình." }, 503);
    if (!await verifyTurnstileToken(body.turnstile_token, address, turnstileSecret, turnstileHostnames)) {
      return json({ error: "Phiên xác minh không hợp lệ hoặc đã hết hạn. Vui lòng thử lại." }, 403);
    }
    const [emailBucket, ipBucket] = await Promise.all([
      hashRateLimitKey("alert-email", normalizedEmail, rateLimitSalt),
      hashRateLimitKey("alert-ip", address, rateLimitSalt),
    ]);
    for (let index = 0; index < requests.length; index += 1) {
      const [emailAllowed, ipAllowed] = await Promise.all([
        consumeRequestBudget(supabase, "setup-alert-email", emailBucket, 5, 3_600),
        consumeRequestBudget(supabase, "setup-alert-ip", ipBucket, 20, 3_600),
      ]);
      if (!emailAllowed || !ipAllowed) {
        return json({ error: "Bạn đã tạo quá nhiều cảnh báo. Vui lòng thử lại sau một giờ." }, 429);
      }
    }
    const originCode = String(requests[0].origin_code);
    if (requests.some((candidate) => candidate.origin_code !== originCode)) {
      return json({ error: "Các cảnh báo trong cùng một lượt phải có chung điểm đi." }, 400);
    }
    const destinationCodes = requests.map((candidate) => String(candidate.destination_code));
    if (new Set(destinationCodes).size !== destinationCodes.length) {
      return json({ error: "Danh sách điểm đến bị trùng." }, 400);
    }
    const { data: trackedRoutes, error: routeError } = await supabase
      .from("tracked_routes")
      .select("id, destination_code, destination_name")
      .eq("origin_code", originCode)
      .in("destination_code", destinationCodes)
      .eq("enabled", true);
    if (routeError) return json({ error: "Không thể kiểm tra tuyến bay lúc này.", error_code: "route_lookup_failed" }, 500);
    if (!trackedRoutes || trackedRoutes.length !== requests.length) {
      return json({ error: "Một hoặc nhiều tuyến bay chưa được hệ thống theo dõi." }, 400);
    }
    const publicSiteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET");
    if (!publicSiteUrl || !resendKey || !unsubscribeSecret) {
      return json({ error: "Dịch vụ email xác nhận chưa được cấu hình." }, 503);
    }
    const alertIds: string[] = [];
    for (const candidate of requests) {
      const trackedRoute = trackedRoutes.find((route) => route.destination_code === candidate.destination_code)!;
      const confirmationToken = createToken();
      const confirmationTokenHash = await hashToken(confirmationToken);
      const { data: alert, error: dbError } = await supabase.from("user_alerts").insert({
          email: normalizedEmail,
          destination: trackedRoute.destination_name,
          destination_code: candidate.destination_code,
          origin_code: candidate.origin_code,
          budget: Number.isFinite(Number(candidate.budget)) ? Number(candidate.budget) : null,
          discount_threshold: (candidate.discount_threshold != null && Number.isFinite(Number(candidate.discount_threshold)) && Number(candidate.discount_threshold) > 0)
            ? Number(candidate.discount_threshold)
            : null,
          preferred_regions: Array.isArray(candidate.preferred_regions) ? candidate.preferred_regions : [],
          frequency: candidate.frequency === "daily" ? "daily" : "instant",
          date_from: candidate.date_from || null,
          date_to: candidate.date_to || null,
          notify_email: true,
          notify_telegram: candidate.channel === "telegram",
          telegram_id: candidate.channel === "telegram" ? candidate.telegram_id : null,
          status: "pending_confirmation",
          confirmation_token_hash: confirmationTokenHash,
          confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).select("id").single();
      if (dbError) {
        if (alertIds.length) await supabase.from("user_alerts").delete().in("id", alertIds);
        return json({ error: "Không thể lưu cảnh báo lúc này.", error_code: "alert_persist_failed" }, 500);
      }

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
          to: [normalizedEmail],
          subject: `Xác nhận cảnh báo giá vé đi ${trackedRoute.destination_name}`,
          html: `<h2>Xác nhận cảnh báo giá</h2>
            <p>Điểm đến: <strong>${escapeHtml(trackedRoute.destination_name)}</strong></p>
            <p>Ngân sách: <strong>${candidate.budget ? Number(candidate.budget).toLocaleString("vi-VN") + " VND" : "Không giới hạn"}</strong></p>
            <p><a href="${confirmationUrl}">Xác nhận cảnh báo</a> (liên kết có hiệu lực 24 giờ).</p>
            <p>Cảnh báo chỉ hoạt động sau khi bạn xác nhận.</p>
            <p><a href="${unsubscribeUrl}">Hủy đăng ký</a></p>`,
        }),
        });
      if (!response.ok) {
        await supabase.from("user_alerts").delete().in("id", [...alertIds, alert.id]);
        return json({ error: "Không thể gửi email xác nhận. Cảnh báo chưa được tạo đầy đủ." }, 502);
      }
      alertIds.push(alert.id);
    }

    return json({
      success: true,
      alert_ids: alertIds,
      status: "pending_confirmation",
      confirmation_sent: true,
    });
  } catch {
    return json({ error: "Không thể tạo cảnh báo lúc này." }, 400);
  }
});
