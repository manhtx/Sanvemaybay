export type ObservedFareRow = Record<string, unknown>;

export interface ScoredObservedFare extends ObservedFareRow {
  opportunity_id?: string;
  discount_percent: number | null;
  baseline_price: number | null;
  sample_size: number;
  percentile: number | null;
  deal_score: number;
  deal_label: string;
  confidence_percent: number;
  confidence_level: "low" | "medium" | "high";
  discount_strength: "unknown" | "light" | "medium" | "strong";
  algorithm_version: string;
  freshness_minutes: number;
}

export const OBSERVED_FARE_ALGORITHM_VERSION = "observed-v2-confidence-gated";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function detailedKey(row: ObservedFareRow): string {
  const tripDays = row.return_date && row.date
    ? Math.max(0, Math.round((Date.parse(String(row.return_date)) - Date.parse(String(row.date))) / 86_400_000))
    : 0;
  return [row.origin_code, row.destination_code, row.date, tripDays, Number(row.stops) === 0 ? "direct" : "stops"].join(":");
}

function fallbackKey(row: ObservedFareRow): string {
  return [row.origin_code, row.destination_code, row.date].join(":");
}

export function buildOpportunityId(row: ObservedFareRow): string {
  const origin = String(row.origin_code ?? row.from_code ?? "").toUpperCase();
  const dest = String(row.destination_code ?? row.to_code ?? "").toUpperCase();
  const depart = String(row.date ?? row.depart_date ?? "");
  const ret = String(row.return_date ?? "");
  const airline = String(row.airline_code ?? "").toUpperCase();
  const stops = Number(row.stops ?? 0);
  return [origin, dest, depart, ret, airline, stops].join(":");
}

export function observedFareDedupeKey(row: ObservedFareRow): string {
  return [row.origin_code, row.destination_code, row.date, row.return_date, row.airline_code, row.stops, row.price].join(":");
}

function freshnessScore(minutes: number): number {
  if (minutes <= 60) return 100;
  if (minutes <= 180) return 85;
  if (minutes <= 720) return 65;
  if (minutes <= 1_440) return 45;
  return Math.max(10, 45 - Math.floor((minutes - 1_440) / 1_440) * 10);
}

export function dealLabel(score: number, confidencePercent = 100): string {
  // A large apparent discount is not a strong deal claim when the comparable
  // sample is still small. Keep the score visible, but cap the language until
  // the evidence catches up.
  if (confidencePercent < 50) return score >= 60 ? "Giá đáng chú ý" : "Giá quan sát";
  if (score >= 90 && confidencePercent >= 75) return "Deal cực nóng";
  if (score >= 80 && confidencePercent >= 65) return "Deal rất ngon";
  if (score >= 70) return "Deal ngon";
  if (score >= 60) return "Giá đáng chú ý";
  return "Giá quan sát";
}

function confidenceLevel(percent: number): "low" | "medium" | "high" {
  if (percent >= 75) return "high";
  if (percent >= 50) return "medium";
  return "low";
}

function discountStrength(discount: number | null): "unknown" | "light" | "medium" | "strong" {
  if (discount == null) return "unknown";
  if (discount >= 30) return "strong";
  if (discount >= 15) return "medium";
  return "light";
}

export function scoreObservedFares(rows: ObservedFareRow[], now = new Date()): ScoredObservedFare[] {
  const deduped = new Map<string, ObservedFareRow>();
  for (const row of rows) {
    const key = observedFareDedupeKey(row);
    const existing = deduped.get(key);
    if (!existing || String(row.timestamp) > String(existing.timestamp)) deduped.set(key, row);
  }
  const candidates = [...deduped.values()];
  const detailed = new Map<string, number[]>();
  const fallback = new Map<string, number[]>();
  for (const row of candidates) {
    const price = Number(row.price);
    if (!(price > 0)) continue;
    detailed.set(detailedKey(row), [...(detailed.get(detailedKey(row)) ?? []), price]);
    fallback.set(fallbackKey(row), [...(fallback.get(fallbackKey(row)) ?? []), price]);
  }
  const scored: ScoredObservedFare[] = candidates.map((row) => {
    const price = Number(row.price);
    const exact = detailed.get(detailedKey(row)) ?? [];
    const broader = fallback.get(fallbackKey(row)) ?? [];
    const comparison = exact.length >= 3 ? exact : broader.length >= 3 ? broader : [];
    const baseline = comparison.length >= 3 ? median(comparison) : null;
    const discount = baseline && baseline > price ? Math.round(((baseline - price) / baseline) * 1_000) / 10 : baseline ? 0 : null;
    const percentile = comparison.length >= 3
      ? Math.round((comparison.filter((value) => value >= price).length / comparison.length) * 100)
      : null;
    const timestamp = Date.parse(String(row.timestamp ?? ""));
    const freshnessMinutes = Number.isFinite(timestamp) ? Math.max(0, Math.round((now.getTime() - timestamp) / 60_000)) : 100_000;
    const discountScore = discount == null ? 0 : Math.min(100, discount * 2.5);
    const percentileScore = percentile ?? 0;
    const confidenceScore = Math.round(Math.min(100, (comparison.length / 12) * 100));
    const qualityScore = Number(row.stops) === 0 ? 100 : 40;
    const score = Math.round(
      discountScore * 0.45 + percentileScore * 0.2 + freshnessScore(freshnessMinutes) * 0.15 +
      confidenceScore * 0.15 + qualityScore * 0.05,
    );
    return {
      ...row,
      opportunity_id: buildOpportunityId(row),
      discount_percent: discount,
      baseline_price: baseline == null ? null : Math.round(baseline),
      sample_size: comparison.length,
      percentile,
      deal_score: score,
      deal_label: dealLabel(score, confidenceScore),
      confidence_percent: confidenceScore,
      confidence_level: confidenceLevel(confidenceScore),
      discount_strength: discountStrength(discount),
      algorithm_version: OBSERVED_FARE_ALGORITHM_VERSION,
      freshness_minutes: freshnessMinutes,
    } as ScoredObservedFare;
  });
  return scored.sort((a, b) =>
    (Number(b.discount_percent ?? -1) - Number(a.discount_percent ?? -1)) ||
    (b.deal_score - a.deal_score) ||
    (String(b.timestamp).localeCompare(String(a.timestamp))) ||
    (Number(a.price) - Number(b.price))
  );
}
