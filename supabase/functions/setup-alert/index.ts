import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req: Request) => {
  // Set CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const body = await req.json();
    const { email, destination, budget, channel } = body;

    if (!email || !destination) {
      throw new Error("Missing email or destination");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert alert into DB
    const { error: dbErr } = await supabase.from('user_alerts').insert([{
      destination,
      budget,
      notify_email: true,
      // email could be stored in a metadata column or mapped to user_id if we do proper Auth
      telegram_id: channel === 'telegram' ? email : null
    }]);

    if (dbErr) console.error("Could not insert to DB:", dbErr);

    if (RESEND_API_KEY) {
      // Send real email via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'FlyCheap Alerts <alerts@flycheap.com>',
          to: [email],
          subject: `Xác nhận đăng ký nhận báo giá vé đi ${destination}`,
          html: `
            <h2>Chào bạn,</h2>
            <p>Hệ thống đã ghi nhận yêu cầu theo dõi giá vé máy bay đi <strong>${destination}</strong> của bạn.</p>
            <p>Mức giá kỳ vọng (Ngân sách): <strong>${budget ? budget.toLocaleString() + ' VND' : 'Mọi mức giá'}</strong></p>
            <p>AI của chúng tôi sẽ quét dữ liệu liên tục mỗi 12 giờ. Ngay khi có vé nằm trong hoặc thấp hơn mức ngân sách của bạn, chúng tôi sẽ thông báo trực tiếp qua email này kèm đường dẫn <strong>SĂN VÉ NGAY</strong>.</p>
            <br/>
            <p>Trân trọng,<br/>Đội ngũ FlyCheap AI</p>
          `
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        console.error("Resend API true error: ", errData);
      }
    } else {
      // Mock email sending
      console.log(`[MOCK EMAIL] Sent confirmation to ${email} for destination ${destination} (Resend API key missing)`);
    }

    return new Response(JSON.stringify({ success: true, message: "Alert setup and notification sent" }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
});
