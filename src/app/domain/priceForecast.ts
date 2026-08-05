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
  const valid = points
    .filter((point) => Number.isFinite(point.price) && point.price > 0 && Number.isFinite(Date.parse(point.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (valid.length < 14) return undefined;
  const values = valid.map((point) => point.price);
  const meanX = (values.length - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / values.length;
  const denominator = values.reduce((sum, _, index) => sum + (index - meanX) ** 2, 0);
  const slope = denominator ? values.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0) / denominator : 0;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - meanY) ** 2, 0) / values.length);
  const normalizedSlope = deviation ? slope / deviation : 0;
  const direction: ForecastDirection = normalizedSlope > 0.03 ? "up" : normalizedSlope < -0.03 ? "down" : "stable";
  const probability = Math.round(Math.min(0.9, 0.5 + Math.min(0.4, Math.abs(normalizedSlope) * 0.8)) * 100) / 100;
  const confidence = Math.round(Math.min(0.85, 0.5 + Math.min(0.35, (values.length - 14) / 40)) * 100) / 100;
  return {
    direction,
    probability,
    confidence,
    horizonDays: Math.max(1, Math.round(horizonDays)),
    sampleCount: values.length,
    limitation: "Ước tính theo xu hướng lịch sử gần đây; không đảm bảo giá tương lai và không thay thế kiểm tra giá trực tiếp.",
  };
}
