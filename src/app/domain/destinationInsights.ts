import { Deal } from "../data/deals";

export interface DestinationInsight {
  destination: string;
  destinationCode: string;
  country: string;
  dealCount: number;
  cheapestPrice: number;
  averageDiscount: number;
  bestDealScore: number;
  topDealId: string;
  hasWeekendDeal: boolean;
}

export function isWeekendFlightDate(departDate: string): boolean {
  if (!departDate) return false;
  const parts = departDate.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      return utcDay === 0 || utcDay === 6;
    }
  }
  return [0, 6].includes(new Date(departDate).getDay());
}

export function buildDestinationInsights(deals: Deal[]): DestinationInsight[] {
  const groups = new Map<string, Deal[]>();
  for (const deal of deals) {
    const key = deal.toCode || deal.to;
    groups.set(key, [...(groups.get(key) ?? []), deal]);
  }

  return [...groups.values()]
    .map((destinationDeals) => {
      const topDeal = [...destinationDeals].sort(
        (a, b) => (b.dealScore ?? b.aiInsight.savingScore) - (a.dealScore ?? a.aiInsight.savingScore),
      )[0];
      const averageDiscount = destinationDeals.reduce((sum, deal) => sum + deal.discount, 0) / destinationDeals.length;
      return {
        destination: topDeal.to,
        destinationCode: topDeal.toCode,
        country: topDeal.country,
        dealCount: destinationDeals.length,
        cheapestPrice: Math.min(...destinationDeals.map((deal) => deal.realTotal)),
        averageDiscount,
        bestDealScore: topDeal.dealScore ?? topDeal.aiInsight.savingScore,
        topDealId: topDeal.id,
        hasWeekendDeal: destinationDeals.some((deal) => isWeekendFlightDate(deal.departDate)),
      };
    })
    .sort((a, b) => b.bestDealScore - a.bestDealScore);
}

