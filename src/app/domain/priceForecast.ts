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

/** Conservative linear baseline. It intentionally refuses sparse history. */
export function forecastPrice(points: PricePoint[], horizonDays = 7): PriceForecast | undefined {
  const nPoints = points.length;
  const valid: { price: number; time: number }[] = [];
  for (let i = 0; i < nPoints; i++) {
    const pt = points[i];
    if (typeof pt?.price === "number" && Number.isFinite(pt.price) && pt.price > 0 && typeof pt?.date === "string") {
      const time = Date.parse(pt.date);
      if (Number.isFinite(time)) {
        valid.push({ price: pt.price, time });
      }
    }
  }
  const n = valid.length;
  if (n < 14) return undefined;
  valid.sort((a, b) => a.time - b.time);

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
