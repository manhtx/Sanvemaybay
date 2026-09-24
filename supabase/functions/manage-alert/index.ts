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

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { action, token, alert_id, signature } = await req.json();
    if (!["confirm", "unsubscribe"].includes(action)) {
      return json({ error: "Yêu cầu không hợp lệ." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (action === "confirm") {
      if (typeof token !== "string" || token.length < 32) {
        return json({ error: "Yêu cầu không hợp lệ." }, 400);
      }
      const tokenHash = await hashToken(token);
      const { data: alert, error } = await supabase
        .from("user_alerts")
        .select("id, confirmation_expires_at, status")
        .eq("confirmation_token_hash", tokenHash)
        .maybeSingle();
      if (error) return json({ error: "Không thể cập nhật cảnh báo lúc này." }, 500);
      if (!alert) return json({ error: "Liên kết xác nhận không tồn tại." }, 404);
      if (alert.status === "active") return json({ success: true, status: "active" });
      if (
        alert.status !== "pending_confirmation" ||
        !alert.confirmation_expires_at ||
        new Date(alert.confirmation_expires_at) < new Date()
      ) {
        return json({ error: "Liên kết xác nhận đã hết hạn." }, 410);
      }

      const { error: updateError } = await supabase
        .from("user_alerts")
        .update({
          status: "active",
          confirmed_at: new Date().toISOString(),
          confirmation_token_hash: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alert.id);
      if (updateError) return json({ error: "Không thể cập nhật cảnh báo lúc này.", error_code: "alert_update_failed" }, 500);
      return json({ success: true, status: "active" });
    }

    const secret = Deno.env.get("UNSUBSCRIBE_SECRET") ?? "";
    if (
      typeof alert_id !== "string" ||
      typeof signature !== "string" ||
      !secret ||
      !safeEqual(await signAlertId(alert_id, secret), signature)
    ) {
      return json({ error: "Liên kết hủy đăng ký không hợp lệ." }, 403);
    }

    const { error: updateError } = await supabase
      .from("user_alerts")
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("id", alert_id);
    if (updateError) return json({ error: "Không thể cập nhật cảnh báo lúc này.", error_code: "alert_update_failed" }, 500);
    return json({ success: true, status: "unsubscribed" });
  } catch (error) {
    return json({ error: "Yêu cầu quản lý cảnh báo không hợp lệ." }, 400);
  }
});
