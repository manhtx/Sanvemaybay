import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { toPriceHistoryRow } from "../_shared/price-history.ts";
import { decideBuyRecommendation } from "../_shared/buy-decision.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

async function requestAiExplanation(dealId: string): Promise<void> {
  const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const secret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
  if (!baseUrl || !secret) throw new Error("AI explanation service is not configured.");
  const response = await fetch(`${baseUrl}/functions/v1/ai-explainer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify({ dealId }),
  });
  if (!response.ok) throw new Error(`AI explanation returned HTTP ${response.status}`);
}

Deno.serve(async (request) => {
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const [
      { data: flights, error: flightError },
      { data: routes, error: routeError },
      { data: routeStats, error: routeStatsError },
    ] = await Promise.all([
      supabase
        .from("flights")
        .select("*")
        .gte("date", new Date().toISOString().slice(0, 10))
        .order("timestamp", { ascending: false })
        .limit(1000),
      supabase.from("tracked_routes").select("id, deal_threshold_percent"),
      supabase.from("route_market_stats").select("*"),
    ]);
    if (flightError) throw flightError;
    if (routeError) throw routeError;
    if (routeStatsError) throw routeStatsError;

    const published: string[] = [];
    const aiFailures: Array<{ itinerary: string; reason: string }> = [];
    const skipped: Array<{ itinerary: string; reason: string }> = [];
    const priceHistoryRows = (flights ?? [])
      .map(toPriceHistoryRow)
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    const seenItineraries = new Set<string>();
    const routeConfigById = new Map((routes ?? []).map((route) => [route.id, route]));
    const statsByRoute = new Map(
      (routeStats ?? []).map((stats) => [
        `${stats.origin_code}:${stats.destination_code}`,
        stats,
      ]),
    );
    const windowPrices = new Map<string, number[]>();

    for (const flight of flights ?? []) {
      if (!flight.itinerary_key || seenItineraries.has(flight.itinerary_key)) continue;
      seenItineraries.add(flight.itinerary_key);

      const windowKey = [
        flight.scan_run_id,
        flight.origin_code,
        flight.destination_code,
        flight.date,
        flight.return_date,
      ].join(":");
      if (!windowPrices.has(windowKey)) {
        const { data: comparableFlights, error: comparableError } = await supabase
          .from("flights")
          .select("price")
          .eq("scan_run_id", flight.scan_run_id)
          .eq("origin_code", flight.origin_code)
          .eq("destination_code", flight.destination_code)
          .eq("date", flight.date)
          .eq("return_date", flight.return_date);
        if (comparableError) throw comparableError;
        windowPrices.set(
          windowKey,
          (comparableFlights ?? [])
            .map((item) => Number(item.price))
            .filter(Number.isFinite),
        );
      }

      const comparablePrices = windowPrices.get(windowKey) ?? [];
      const stats = statsByRoute.get(`${flight.origin_code}:${flight.destination_code}`);
      const historicalSamples = Number(stats?.samples_30d ?? 0);
      const hasCurrentComparison = comparablePrices.length >= 5;
      const hasHistoricalComparison = historicalSamples >= 3;
      if (!hasCurrentComparison && !hasHistoricalComparison) {
        skipped.push({ itinerary: flight.itinerary_key, reason: "insufficient_comparable_prices" });
        continue;
      }

      const currentMedian = hasCurrentComparison ? median(comparablePrices) : 0;
      const avg7d = Number(stats?.avg_7d ?? 0);
      const avg30d = Number(stats?.avg_30d ?? 0);
      const historicalBaseline = Math.max(avg7d || 0, avg30d || 0);
      const baseline = currentMedian || historicalBaseline;
      const routeConfig = routeConfigById.get(flight.route_id);
      const thresholdPercent = Number(routeConfig?.deal_threshold_percent ?? 10);
      if (!baseline || Number(flight.price) >= baseline * (1 - thresholdPercent / 100)) {
        skipped.push({ itinerary: flight.itinerary_key, reason: "not_a_deal" });
        continue;
      }

      const discount = Math.round((1 - flight.price / baseline) * 100);
      const comparisonSamples = hasCurrentComparison
        ? comparablePrices.length
        : historicalSamples;
      const confidence = hasCurrentComparison
        ? Math.min(0.9, 0.55 + Math.min(comparisonSamples, 20) / 60)
        : Math.min(0.95, 0.55 + Math.min(historicalSamples, 30) / 75);
      const score = Math.min(100, Math.round(discount * 1.7 + confidence * 30));
      const recommendation = decideBuyRecommendation({
        discount,
        confidence,
        comparableSamples: comparisonSamples,
      });

      const deal = {
        itinerary_key: flight.itinerary_key,
        from: flight.origin,
        from_code: flight.origin_code,
        to: flight.destination,
        to_code: flight.destination_code,
        country: flight.country,
        region: flight.region,
        image: "",
        price: flight.price,
        normal_price: Math.round(baseline),
        discount,
        currency: flight.currency,
        airline: flight.airline,
        airline_code: flight.airline_code,
        depart_date: flight.date,
        return_date: flight.return_date,
        duration: flight.duration,
        stops: flight.stops,
        stop_city: null,
        seats_left: 0,
        expires_in: "Kiểm tra lại trước khi đặt",
        flight_number: flight.flight_number,
        booking_url: flight.booking_url,
        source: flight.source,
        observed_at: flight.timestamp,
        valid_until: new Date(new Date(flight.timestamp).getTime() + 13 * 60 * 60 * 1000).toISOString(),
        ai_insight: {
          reason: hasCurrentComparison
            ? `Giá hiện tại thấp hơn ${discount}% so với trung vị của các lựa chọn cùng tuyến và cùng ngày.`
            : `Giá hiện tại thấp hơn ${discount}% so với mức trung bình lịch sử của tuyến này.`,
          tags: hasCurrentComparison
            ? ["So sánh cùng ngày", `${comparisonSamples} lựa chọn`]
            : ["Dữ liệu lịch sử", `${historicalSamples} lần quét/30 ngày`],
          risk: confidence >= 0.8 ? "low" : "medium",
          riskDetails: "Giá và chỗ trống có thể thay đổi khi chuyển sang trang đặt vé.",
          recommendation,
          recommendationNote:
            recommendation === "buy_now"
              ? "Mức giảm đủ lớn và độ tin cậy lịch sử tốt."
              : "Nên kiểm tra lại giá trực tiếp trước khi quyết định.",
          savingScore: score,
        },
        hidden_costs: [],
        advertised_total: flight.price,
        real_total: flight.price,
        is_trending: score >= 80,
        is_flash_deal: discount >= 30,
        trip_type: flight.region === "domestic" ? "domestic" : "international",
        confidence,
        deal_score: score,
        market_stats: {
          comparison_basis: hasCurrentComparison ? "same_search_median" : "route_history",
          comparable_prices: comparisonSamples,
          current_median: currentMedian || null,
          avg_7d: avg7d || null,
          avg_30d: avg30d || null,
          samples_30d: historicalSamples,
        },
      };

      const { data: publishedDeal, error: publishError } = await supabase
        .from("deals")
        .upsert(deal, { onConflict: "itinerary_key" })
        .select("id")
        .single();
      if (publishError) throw publishError;
      published.push(flight.itinerary_key);
      const { error: snapshotError } = await supabase.from("deal_snapshots").upsert({
        deal_id: publishedDeal?.id ?? null,
        itinerary_key: flight.itinerary_key,
        from_code: flight.origin_code,
        to_code: flight.destination_code,
        depart_date: flight.date,
        return_date: flight.return_date,
        price: flight.price,
        normal_price: Math.round(baseline),
        discount,
        deal_score: score,
        confidence,
        currency: flight.currency,
        booking_url: flight.booking_url,
        source: flight.source,
        observed_at: flight.timestamp,
        valid_until: deal.valid_until,
        payload: deal,
      }, { onConflict: "itinerary_key,observed_at" });
      if (snapshotError) throw snapshotError;
      if (publishedDeal?.id) {
        try {
          await requestAiExplanation(publishedDeal.id);
        } catch (error) {
          aiFailures.push({
            itinerary: flight.itinerary_key,
            reason: error instanceof Error ? error.message : "Unknown AI explanation error",
          });
        }
      }
    }

    if (priceHistoryRows.length > 0) {
      const { error: historyError } = await supabase
        .from("price_history")
        .insert(priceHistoryRows);
      if (historyError) throw historyError;
    }

    return json({
      success: true,
      observations_processed: flights?.length ?? 0,
      price_history_saved: priceHistoryRows.length,
      deals_published: published.length,
      ai_failures: aiFailures,
      skipped,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown analyzer error" }, 500);
  }
});
