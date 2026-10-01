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

export function explainTradeoff(cheaper: DealComparisonRow, costlier: DealComparisonRow): string {
  const priceDiff = costlier.totalCost - cheaper.totalCost;
  if (priceDiff <= 0) return "Hai phương án có tổng chi phí tương đương.";

  const stopsDiff = cheaper.stops - costlier.stops;
  const timeDiffMinutes = (cheaper.durationMinutes ?? 0) - (costlier.durationMinutes ?? 0);

  const formatMoney = (n: number) => {
    if (n >= 1_000_000) {
      const tr = (n / 1_000_000).toFixed(1).replace(/\.0$/, "");
      return `${tr} triệu`;
    }
    return `${Math.round(n / 1000)}k`;
  };

  const parts: string[] = [];
  if (timeDiffMinutes >= 60) {
    const hours = Math.round(timeDiffMinutes / 60);
    parts.push(`mất thêm ${hours} giờ`);
  }
  if (stopsDiff > 0) {
    parts.push(`thêm ${stopsDiff} điểm dừng`);
  }

  if (parts.length > 0) {
    return `Rẻ hơn khoảng ${formatMoney(priceDiff)} nhưng ${parts.join(" và ")}.`;
  }
  if (timeDiffMinutes <= -60) {
    return `Rẻ hơn khoảng ${formatMoney(priceDiff)} và bay nhanh hơn.`;
  }
  return `Rẻ hơn khoảng ${formatMoney(priceDiff)} với hành trình tương đương.`;
}

