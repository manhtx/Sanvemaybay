import { PricePoint } from "../data/deals";

export const PRICE_HISTORY_WINDOWS = [7, 30, 90, 180] as const;
export type PriceHistoryWindow = (typeof PRICE_HISTORY_WINDOWS)[number];

/** Keep only valid ISO-date observations inside the selected inclusive window. */
export function filterPriceHistoryByDays(points: PricePoint[], days: PriceHistoryWindow): PricePoint[] {
  const valid = points
    .map((point) => ({ ...point, timestamp: Date.parse(point.date) }))
    .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price) && point.price > 0);
  if (!valid.length) return [];
  const anchor = Math.max(...valid.map((point) => point.timestamp));
  const threshold = anchor - (days - 1) * 24 * 60 * 60 * 1000;
  return valid
    .filter((point) => point.timestamp >= threshold && point.timestamp <= anchor)
    .sort((left, right) => left.timestamp - right.timestamp)
    .map(({ timestamp: _timestamp, ...point }) => point);
}
