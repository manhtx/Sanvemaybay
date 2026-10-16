import { PricePoint } from "../data/deals";

export const PRICE_HISTORY_WINDOWS = [7, 30, 90, 180] as const;
export type PriceHistoryWindow = (typeof PRICE_HISTORY_WINDOWS)[number];

export interface ObservationTimelineGap {
  fromDate: string;
  toDate: string;
  gapDays: number;
  explanation: string;
}

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

/**
 * Detects unmonitored scan gaps between consecutive observations.
 * INVARIANT F29: Timeline of genuine observation points; does not synthesize intermediate daily points across an unmonitored gap.
 */
export function detectPriceHistoryGaps(points: PricePoint[], gapThresholdDays = 3): ObservationTimelineGap[] {
  if (points.length < 2) return [];

  const valid = points
    .map((p) => ({ ...p, ts: Date.parse(p.date) }))
    .filter((p) => Number.isFinite(p.ts))
    .sort((a, b) => a.ts - b.ts);

  const gaps: ObservationTimelineGap[] = [];

  for (let i = 0; i < valid.length - 1; i++) {
    const diffMs = valid[i + 1].ts - valid[i].ts;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= gapThresholdDays) {
      gaps.push({
        fromDate: valid[i].date,
        toDate: valid[i + 1].date,
        gapDays: diffDays,
        explanation: `Khoảng trống không quét ${diffDays} ngày (${valid[i].date} → ${valid[i + 1].date}) được giữ nguyên trung thực, không nội suy điểm dữ liệu giả mạo.`,
      });
    }
  }

  return gaps;
}
