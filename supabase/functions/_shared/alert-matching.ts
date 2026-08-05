export type AlertMatchInput = {
  destination?: string | null;
  destination_code?: string | null;
  origin_code?: string | null;
  budget?: number | null;
  discount_threshold?: number | null;
  preferred_regions?: string[] | null;
  date_from?: string | null;
  date_to?: string | null;
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
};

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value;
}

export function matchesAlert(alert: AlertMatchInput, deal: AlertDealInput): boolean {
  const destinationMatches = alert.destination_code
    ? alert.destination_code === deal.to_code
    : alert.destination === deal.to;
  const originMatches = !alert.origin_code || alert.origin_code === deal.from_code;
  const budgetMatches = !alert.budget || Number(deal.price) <= Number(alert.budget);
  const discountMatches = Number(deal.discount) >= Number(alert.discount_threshold ?? 0);
  const regionMatches =
    !alert.preferred_regions?.length ||
    (deal.trip_type === "domestic"
      ? alert.preferred_regions.includes("Domestic")
      : alert.preferred_regions.includes("International"));
  const dateMatches =
    (!alert.date_from || (deal.depart_date ?? "") >= alert.date_from) &&
    (!alert.date_to || (deal.depart_date ?? "") <= alert.date_to);
  return destinationMatches && originMatches && budgetMatches && discountMatches && regionMatches && dateMatches;
}

export function selectDailyDeal<T extends AlertDealInput>(deals: T[]): T[] {
  return [...deals]
    .sort((a, b) => Number(b.deal_score ?? 0) - Number(a.deal_score ?? 0))
    .slice(0, 1);
}
