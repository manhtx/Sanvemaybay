import { PricePoint } from "../data/deals";

export type ForecastDirection = "up" | "down" | "stable";

export interface PriceForecast {
  direction: ForecastDirection;
  probability: number;
  confidence: number;
  horizonDays: number;
  sampleCount: number;
  limitation: string;
}

const TS_CACHE = new Map<string, number>();

function parseDateFast(str: string): number {
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
  } else {
    result = Date.parse(str);
  }
  if (TS_CACHE.size > 5000) TS_CACHE.clear();
  if (Number.isFinite(result)) {
    TS_CACHE.set(str, result);
  }
  return result;
}

/** Conservative linear baseline. It intentionally refuses sparse history. */
export function forecastPrice(points: PricePoint[], horizonDays = 7): PriceForecast | undefined {
  const nPoints = points.length;
  if (nPoints < 14) return undefined;

  const valid: { price: number; time: number }[] = [];
  let isSorted = true;
  let lastTime = -Infinity;

  for (let i = 0; i < nPoints; i++) {
    const pt = points[i];
    if (typeof pt?.price === "number" && Number.isFinite(pt.price) && pt.price > 0 && typeof pt?.date === "string") {
      const time = parseDateFast(pt.date);
      if (Number.isFinite(time)) {
        if (time < lastTime) {
          isSorted = false;
        }
        lastTime = time;
        valid.push({ price: pt.price, time });
      }
    }
  }
  const n = valid.length;
  if (n < 14) return undefined;
  if (!isSorted) {
    valid.sort((a, b) => a.time - b.time);
  }

  let sumY = 0;
  for (let i = 0; i < n; i++) sumY += valid[i].price;
  const meanY = sumY / n;
  const meanX = (n - 1) / 2;
  const denominator = (n * (n * n - 1)) / 12;

  let num = 0;
  let sumSqDiffY = 0;
  for (let i = 0; i < n; i++) {
    const price = valid[i].price;
    const diffY = price - meanY;
    num += (i - meanX) * price;
    sumSqDiffY += diffY * diffY;
  }

  const slope = denominator ? num / denominator : 0;
  const deviation = Math.sqrt(sumSqDiffY / n);
  const normalizedSlope = deviation ? slope / deviation : 0;
  const direction: ForecastDirection = normalizedSlope > 0.03 ? "up" : normalizedSlope < -0.03 ? "down" : "stable";
  const probability = Math.round(Math.min(0.9, 0.5 + Math.min(0.4, Math.abs(normalizedSlope) * 0.8)) * 100) / 100;
  const confidence = Math.round(Math.min(0.85, 0.5 + Math.min(0.35, (n - 14) / 40)) * 100) / 100;
  return {
    direction,
    probability,
    confidence,
    horizonDays: Math.max(1, Math.round(horizonDays)),
    sampleCount: n,
    limitation: "Ước tính theo xu hướng lịch sử gần đây; không đảm bảo giá tương lai và không thay thế kiểm tra giá trực tiếp.",
  };
}
