import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";

Deno.serve(async (req: Request) => {
  const unauthorized = requireInternalSecret(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const dealId = typeof body?.dealId === "string" ? body.dealId : "";
  if (!dealId) {
    return new Response(JSON.stringify({ error: "dealId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Fetch deal details
    const { data: deal, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (error) throw error;

    const route = `${deal.from} → ${deal.to}`;
    const samples = Number(deal.market_stats?.samples_30d ?? 0);
    const confidence = Math.round(Number(deal.confidence ?? 0) * 100);
    const aiReasoning =
      `Giá chặng ${route} thấp hơn ${deal.discount}% so với mức tham chiếu từ ` +
      `${samples} lần quét trong 30 ngày. Độ tin cậy hiện tại là ${confidence}%. ` +
      "Hệ thống chưa có dữ liệu để kết luận nguyên nhân thuộc về khuyến mãi hay mùa vụ.";

    // This function only explains measured facts. It does not invent a cause.
    const { error: updateError } = await supabase
      .from("deals")
      .update({ ai_reasoning: aiReasoning })
      .eq("id", dealId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, reasoning: aiReasoning }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown AI explainer error" }),
      { status: 500 },
    );
  }
});
