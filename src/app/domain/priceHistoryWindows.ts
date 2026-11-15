import { PricePoint } from "../data/deals";

export const PRICE_HISTORY_WINDOWS = [7, 30, 90, 180] as const;
export type PriceHistoryWindow = (typeof PRICE_HISTORY_WINDOWS)[number];

const TS_CACHE = new Map<string, number>();

function parseTimestampFast(str: string): number {
  if (typeof str !== "string") return NaN;
  const cached = TS_CACHE.get(str);
  if (cached !== undefined) return cached;

  let result = NaN;
  const len = str.length;
  if (len === 10) {
    const c0 = str.charCodeAt(0) - 48;
    const c1 = str.charCodeAt(1) - 48;
    const c2 = str.charCodeAt(2) - 48;
    const c3 = str.charCodeAt(3) - 48;
    const c5 = str.charCodeAt(5) - 48;
    const c6 = str.charCodeAt(6) - 48;
    const c8 = str.charCodeAt(8) - 48;
    const c9 = str.charCodeAt(9) - 48;
    if (
      str.charCodeAt(4) === 45 &&
      str.charCodeAt(7) === 45 &&
      c0 >= 0 && c0 <= 9 &&
      c1 >= 0 && c1 <= 9 &&
      c2 >= 0 && c2 <= 9 &&
      c3 >= 0 && c3 <= 9 &&
      c5 >= 0 && c5 <= 9 &&
      c6 >= 0 && c6 <= 9 &&
      c8 >= 0 && c8 <= 9 &&
      c9 >= 0 && c9 <= 9
    ) {
      result = Date.UTC(
        c0 * 1000 + c1 * 100 + c2 * 10 + c3,
        c5 * 10 + c6 - 1,
        c8 * 10 + c9,
      );
    }
  } else if (len >= 19 && str.charCodeAt(10) === 84 /* 'T' */) {
    const c0 = str.charCodeAt(0) - 48;
    const c1 = str.charCodeAt(1) - 48;
    const c2 = str.charCodeAt(2) - 48;
    const c3 = str.charCodeAt(3) - 48;
    const c5 = str.charCodeAt(5) - 48;
    const c6 = str.charCodeAt(6) - 48;
    const c8 = str.charCodeAt(8) - 48;
    const c9 = str.charCodeAt(9) - 48;
    const h0 = str.charCodeAt(11) - 48;
    const h1 = str.charCodeAt(12) - 48;
    const m0 = str.charCodeAt(14) - 48;
    const m1 = str.charCodeAt(15) - 48;
    const s0 = str.charCodeAt(17) - 48;
    const s1 = str.charCodeAt(18) - 48;
    if (
      str.charCodeAt(4) === 45 &&
      str.charCodeAt(7) === 45 &&
      str.charCodeAt(13) === 58 &&
      str.charCodeAt(16) === 58 &&
      str.endsWith("Z")
    ) {
      let ms = 0;
      if (str.charCodeAt(19) === 46 /* '.' */) {
        const msStr = str.slice(20, -1);
        ms = Number(msStr.padEnd(3, "0").slice(0, 3));
      }
      result = Date.UTC(
        c0 * 1000 + c1 * 100 + c2 * 10 + c3,
        c5 * 10 + c6 - 1,
        c8 * 10 + c9,
        h0 * 10 + h1,
        m0 * 10 + m1,
        s0 * 10 + s1,
        ms,
      );
    }
  } else {
    result = Date.parse(str);
  }

  if (TS_CACHE.size < 10000) {
    TS_CACHE.set(str, result);
  }
  return result;
}

const PT_TS_CACHE = new WeakMap<PricePoint, number>();

/** Keep only valid ISO-date observations inside the selected inclusive window. */
export function filterPriceHistoryByDays(points: PricePoint[], days: PriceHistoryWindow): PricePoint[] {
  const n = points.length;
  if (!n) return [];

  // Pass 1: Find anchor and check chronological sortedness with zero allocations
  let anchor = -Infinity;
  let isSorted = true;
  let prevTs = -Infinity;
  let validCount = 0;

  for (let i = 0; i < n; i++) {
    const pt = points[i];
    const price = pt.price;
    if (price > 0 && Number.isFinite(price)) {
      let ts = PT_TS_CACHE.get(pt);
      if (ts === undefined) {
        ts = parseTimestampFast(pt.date);
        PT_TS_CACHE.set(pt, ts);
      }
      if (Number.isFinite(ts)) {
        validCount++;
        if (ts > anchor) anchor = ts;
        if (ts < prevTs) isSorted = false;
        prevTs = ts;
      }
    }
  }

  if (!validCount) return [];

  const threshold = anchor - (days - 1) * 86400000;

  // Pass 2: Filter only points inside window
  const filtered: PricePoint[] = [];

  for (let i = 0; i < n; i++) {
    const pt = points[i];
    const price = pt.price;
    if (price > 0 && Number.isFinite(price)) {
      const ts = PT_TS_CACHE.get(pt)!;
      if (ts >= threshold && ts <= anchor) {
        filtered.push(pt);
      }
    }
  }

  const filteredLen = filtered.length;
  if (!filteredLen) return [];

  if (!isSorted && filteredLen > 1) {
    filtered.sort((a, b) => PT_TS_CACHE.get(a)! - PT_TS_CACHE.get(b)!);
  }

  return filtered;
}
