import { Deal } from "../data/deals";

export interface DealComparisonRow {
  id: string;
  route: string;
  ticketPrice: number;
  totalCost: number;
  durationMinutes: number | undefined;
  stops: number;
  refundPolicy: string | undefined;
  risk: Deal["aiInsight"]["risk"];
}

function durationMinutes(duration: string): number | undefined {
  const hours = duration.match(/(\d+)\s*h/i)?.[1];
  const minutes = duration.match(/(\d+)\s*m/i)?.[1];
  if (!hours && !minutes) return undefined;
  return Number(hours ?? 0) * 60 + Number(minutes ?? 0);
}

export function compareDeals(deals: Deal[]): DealComparisonRow[] {
  return deals.map((deal) => ({
    id: deal.id,
    route: `${deal.fromCode} → ${deal.toCode}`,
    ticketPrice: deal.price,
    totalCost: deal.realTotal,
    durationMinutes: durationMinutes(deal.duration),
    stops: deal.stops,
    refundPolicy: deal.refundPolicy,
    risk: deal.aiInsight.risk,
  }));
}
