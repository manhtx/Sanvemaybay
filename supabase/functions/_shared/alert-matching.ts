export const METRO_AIRPORT_MAP: Record<string, string[]> = {
  BKK_ALL: ["BKK", "DMK"],
  TYO_ALL: ["NRT", "HND"],
  LON_ALL: ["LHR", "LGW", "STN"],
  PAR_ALL: ["CDG", "ORY"],
  NYC_ALL: ["JFK", "EWR", "LGA"],
};

export type AlertMatchInput = {
  destination?: string | null;
  destination_code?: string | null;
  origin_code?: string | null;
  budget?: number | null;
  discount_threshold?: number | null;
  preferred_regions?: string[] | null;
  date_from?: string | null;
  date_to?: string | null;
  max_stops?: number | null;
  trip_type?: "oneway" | "roundtrip" | null;
  return_date?: string | null;
  location_scope?: "exact" | "metro" | "nearby" | null;
};

export type AlertDealInput = {
  to?: string | null;
  to_code?: string | null;
  from_code?: string | null;
  price?: number | string | null;
  discount?: number | string | null;
  trip_type?: string | null;
  deal_score?: number | string | null;
  depart_date?: string | null;
  return_date?: string | null;
  stops?: number | string | null;
};

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value;
}

export function matchLocationScope(targetCode: string | null | undefined, dealCode: string | null | undefined, scope?: string | null): boolean {
  if (!targetCode) return true;
  if (!dealCode) return false;
  const targetUpper = targetCode.trim().toUpperCase();
  const dealUpper = dealCode.trim().toUpperCase();
  if (targetUpper === dealUpper) return true;
  if (scope === "metro" || targetUpper.endsWith("_ALL")) {
    const served = METRO_AIRPORT_MAP[targetUpper];
    if (served && served.includes(dealUpper)) return true;
  }
  return false;
}

export function matchesAlert(alert: AlertMatchInput, deal: AlertDealInput): boolean {
  const destinationMatches = alert.destination_code
    ? matchLocationScope(alert.destination_code, deal.to_code, alert.location_scope)
    : alert.destination === deal.to;
  const originMatches = !alert.origin_code || matchLocationScope(alert.origin_code, deal.from_code, alert.location_scope);
  const budgetMatches = !alert.budget || Number(deal.price) <= Number(alert.budget);
  const hasExplicitDiscount = alert.discount_threshold != null && Number(alert.discount_threshold) > 0;
  const discountMatches = !hasExplicitDiscount || Number(deal.discount ?? 0) >= Number(alert.discount_threshold);
  const regionMatches =
    !alert.preferred_regions?.length ||
    (deal.trip_type === "domestic"
      ? alert.preferred_regions.includes("Domestic")
      : alert.preferred_regions.includes("International"));
  const dateMatches =
    (!alert.date_from || (deal.depart_date ?? "") >= alert.date_from) &&
    (!alert.date_to || (deal.depart_date ?? "") <= alert.date_to);

  // Stops constraint
  const stopsMatches = alert.max_stops == null || (deal.stops != null && Number(deal.stops) <= Number(alert.max_stops));

  // Return date constraint
  const returnDateMatches = !alert.return_date || !deal.return_date || deal.return_date === alert.return_date;

  // Trip type constraint (roundtrip requires return_date, oneway requires absence of return_date)
  let tripTypeMatches = true;
  if (alert.trip_type === "roundtrip") {
    tripTypeMatches = Boolean(deal.return_date);
  } else if (alert.trip_type === "oneway") {
    tripTypeMatches = !deal.return_date;
  }

  return destinationMatches && originMatches && budgetMatches && discountMatches && regionMatches && dateMatches && stopsMatches && returnDateMatches && tripTypeMatches;
}

export function selectDailyDeal<T extends AlertDealInput>(deals: T[]): T[] {
  return [...deals]
    .sort((a, b) => Number(b.deal_score ?? 0) - Number(a.deal_score ?? 0))
    .slice(0, 1);
}

