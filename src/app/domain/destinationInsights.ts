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
        hasWeekendDeal: destinationDeals.some((deal) => [0, 6].includes(new Date(deal.departDate).getDay())),
      };
    })
    .sort((a, b) => b.bestDealScore - a.bestDealScore);
}
