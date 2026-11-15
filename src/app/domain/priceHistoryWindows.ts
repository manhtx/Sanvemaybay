import { PricePoint } from "../data/deals";

export const PRICE_HISTORY_WINDOWS = [7, 30, 90, 180] as const;
export type PriceHistoryWindow = (typeof PRICE_HISTORY_WINDOWS)[number];

/** Keep only valid ISO-date observations inside the selected inclusive window. */
export function filterPriceHistoryByDays(points: PricePoint[], days: PriceHistoryWindow): PricePoint[] {
  const n = points.length;
  if (!n) return [];
  const valid: { point: PricePoint; timestamp: number }[] = [];
  let anchor = -Infinity;
  for (let i = 0; i < n; i++) {
    const pt = points[i];
    const price = pt.price;
    if (price > 0 && Number.isFinite(price)) {
      const ts = Date.parse(pt.date);
      if (Number.isFinite(ts)) {
        valid.push({ point: pt, timestamp: ts });
        if (ts > anchor) anchor = ts;
      }
    }
  }
  if (!valid.length) return [];
  const threshold = anchor - (days - 1) * 86400000;
  const filtered: { point: PricePoint; timestamp: number }[] = [];
  for (let i = 0; i < valid.length; i++) {
    const item = valid[i];
    if (item.timestamp >= threshold && item.timestamp <= anchor) {
      filtered.push(item);
    }
  }
  filtered.sort((a, b) => a.timestamp - b.timestamp);
  const result = new Array<PricePoint>(filtered.length);
  for (let i = 0; i < filtered.length; i++) {
    result[i] = filtered[i].point;
  }
  return result;
}
