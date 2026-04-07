import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const { dealId } = await req.json();
  
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

    // 2. Prepare Context for AI
    const context = {
      route: `${deal.from} to ${deal.to}`,
      priceValue: deal.price,
      stats: deal.market_stats,
      month: new Date(deal.depart_date).getMonth() + 1,
    };

    // 3. Prompt Construction (for Module 2.3)
    const prompt = `
      Analyze this flight deal:
      Route: ${context.route}
      Current Price: ${context.priceValue}
      7D Average: ${context.stats?.avg_7d}
      
      Why is this price lower? (Consider low travel demand, promotional campaigns, or seasonality).
      Vietnamese explanation, professional and enthusiastic tone.
    `;

    // 4. Call AI (Placeholder logic - in prod we use OpenAI/Gemini SDK)
    const aiReasoning = `Giá vé chặng ${context.route} đang giảm mạnh ${deal.discount}% so với trung bình 7 ngày qua. Đây là cơ hội vàng do hãng hàng không ${deal.airline} đang có chiến dịch khuyến mãi cho mùa thấp điểm tháng ${context.month}.`;

    // 5. Update DB
    await supabase
      .from("deals")
      .update({ ai_reasoning: aiReasoning })
      .eq("id", dealId);

    return new Response(JSON.stringify({ success: true, reasoning: aiReasoning }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
