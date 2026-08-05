import { PricePoint } from "../data/deals";

export interface PriceAnalytics {
  lowest: number;
  highest: number;
  average: number;
  median: number;
  volatilityPercent: number;
  currentPercentile: number | undefined;
  cheapestWeekday: number | undefined;
}

export function buildPriceAnalytics(points: PricePoint[], currentPrice?: number): PriceAnalytics | undefined {
  const valid = points
    .filter((point) => Number.isFinite(point.price) && point.price > 0 && Number.isFinite(new Date(point.date).getTime()))
    .sort((a, b) => a.price - b.price);
  if (!valid.length) return undefined;
  const values = valid.map((point) => point.price);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  const standardDeviation = Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
  const weekdayTotals = new Map<number, { sum: number; count: number }>();
  valid.forEach((point) => {
    const weekday = new Date(point.date).getDay();
    const bucket = weekdayTotals.get(weekday) ?? { sum: 0, count: 0 };
    bucket.sum += point.price;
    bucket.count += 1;
    weekdayTotals.set(weekday, bucket);
  });
  const cheapestWeekday = [...weekdayTotals.entries()].sort((a, b) =>
    a[1].sum / a[1].count - b[1].sum / b[1].count,
  )[0]?.[0];
  const currentPercentile = currentPrice == null || !Number.isFinite(currentPrice)
    ? undefined
    : Math.round(values.filter((value) => value <= currentPrice).length / values.length * 100);
  return {
    lowest: values[0], highest: values[values.length - 1], average, median,
    volatilityPercent: average ? standardDeviation / average * 100 : 0,
    currentPercentile, cheapestWeekday,
  };
}
