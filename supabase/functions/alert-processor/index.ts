import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const { deal } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Fetch matching alerts
    const { data: alerts, error } = await supabase
      .from("user_alerts")
      .select("*")
      .eq("destination", deal.to)
      .lte("budget", deal.price);

    if (error) throw error;

    const notifications = [];

    for (const alert of alerts) {
      if (alert.notify_telegram && alert.telegram_id) {
        // Mock Telegram call
        console.log(`Sending Telegram alert to ${alert.telegram_id} for deal ${deal.id}`);
        notifications.push({ type: "telegram", to: alert.telegram_id });
      }
      
      if (alert.notify_email) {
        // Mock Email call
        console.log(`Sending Email alert to user ${alert.user_id} for deal ${deal.id}`);
        notifications.push({ type: "email", to: alert.user_id });
      }
    }

    return new Response(JSON.stringify({ success: true, notifications_sent: notifications.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
