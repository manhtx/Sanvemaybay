import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { data: latestFlights, error: flightError } = await supabase
      .from("flights")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (flightError) throw flightError;

    const insights = [];

    for (const flight of latestFlights) {
      // Fetch market stats for this route
      const { data: stats, error: statsError } = await supabase
        .from("route_market_stats")
        .select("*")
        .eq("origin_code", flight.origin_code)
        .eq("destination_code", flight.destination_code)
        .single();

      if (statsError && statsError.code !== "PGRST116") throw statsError;

      if (stats) {
        let isDeal = false;
        let dealType = "NORMAL";
        let discountPercent = 0;

        // Logic from PRD (Module 2.1)
        if (flight.price < stats.avg_7d * 0.8) {
          isDeal = true;
          dealType = "DEAL";
          discountPercent = Math.round((1 - flight.price / stats.avg_7d) * 100);
        }
        
        if (flight.price < stats.avg_30d * 0.7) {
          isDeal = true;
          dealType = "STRONG_DEAL";
          discountPercent = Math.round((1 - flight.price / stats.avg_30d) * 100);
        }

        if (isDeal) {
          // Promote to 'deals' table
          const { error: promoError } = await supabase
            .from("deals")
            .insert([{
              from: flight.origin,
              from_code: flight.origin_code,
              to: flight.destination,
              to_code: flight.destination_code,
              price: flight.price,
              discount: discountPercent,
              airline: flight.airline,
              airline_code: flight.airline_code,
              is_flash_deal: dealType === "STRONG_DEAL",
              deal_score: Math.min(100, discountPercent + 20),
              market_stats: { avg_7d: stats.avg_7d, avg_30d: stats.avg_30d }
            }]);

          if (promoError) console.error("Error promoting deal:", promoError);
          insights.push({ route: `${flight.origin_code}-${flight.destination_code}`, deal: dealType });
        }
      }
    }

    return new Response(JSON.stringify({ processed: latestFlights.length, deals_found: insights.length, details: insights }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
