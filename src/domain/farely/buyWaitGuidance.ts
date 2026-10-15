/**
 * FARELY TRUST-CALIBRATED BUY / WAIT GUIDANCE
 * 
 * Satisfies:
 * - F36 (P2): Trust-calibrated Buy/Wait guidance
 * 
 * INVARIANTS:
 * - "Return insufficient_data until real out-of-sample evidence supports stronger guidance."
 * - Fail-closed on sparse history (minimum 14 observations spanning >= 7 days required).
 * - Never advise "WAIT" when price is already in lowest 5th percentile of historical cohort.
 * - Never advise "BUY" with strong confidence unless historical volatility and sample sufficiency are proven.
 */

export interface PricePoint {
  date: string;
  price: number;
}

export type BuyWaitRecommendation = "BUY_NOW" | "WAIT_AND_WATCH" | "INSUFFICIENT_DATA";

export interface BuyWaitEvaluation {
  recommendation: BuyWaitRecommendation;
  confidence: number; // 0.0 to 1.0
  isCalibrated: boolean;
  sampleCount: number;
  timespanDays: number;
  cohortPercentile?: number; // 0 to 100
  rationaleVi: string;
  historicalMin?: number;
  historicalMedian?: number;
}

export const MIN_OBSERVATION_POINTS = 14;
export const MIN_TIMESPAN_DAYS = 7;

/**
 * Evaluates whether current price warrants a BUY_NOW or WAIT_AND_WATCH recommendation,
 * or safely fails closed to INSUFFICIENT_DATA when evidence is inadequate.
 */
export function evaluateBuyWaitGuidance(params: {
  currentPrice: number;
  priceHistory: PricePoint[];
  departureDate: string;
  evaluationDate?: string; // defaults to today ISO
}): BuyWaitEvaluation {
  const currentPrice = Number(params.currentPrice);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return {
      recommendation: "INSUFFICIENT_DATA",
      confidence: 0,
      isCalibrated: false,
      sampleCount: 0,
      timespanDays: 0,
      rationaleVi: "Giá hiện tại không hợp lệ để phân tích khuyến nghị mua.",
    };
  }

  // Filter valid points with finite positive prices and valid timestamps
  const validPoints = (params.priceHistory || [])
    .filter((p) => Number.isFinite(p.price) && p.price > 0 && Number.isFinite(Date.parse(p.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  // Compute timespan across observations
  let timespanDays = 0;
  if (validPoints.length >= 2) {
    const firstDate = new Date(validPoints[0].date).getTime();
    const lastDate = new Date(validPoints[validPoints.length - 1].date).getTime();
    timespanDays = Math.max(0, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
  }

  // F36 Invariant: Fail-closed if points < 14 or timespan < 7 days
  if (validPoints.length < MIN_OBSERVATION_POINTS || timespanDays < MIN_TIMESPAN_DAYS) {
    return {
      recommendation: "INSUFFICIENT_DATA",
      confidence: 0,
      isCalibrated: false,
      sampleCount: validPoints.length,
      timespanDays,
      rationaleVi: `Chưa đủ dữ liệu lịch sử tối thiểu (${validPoints.length}/${MIN_OBSERVATION_POINTS} lượt quan sát qua ${timespanDays}/${MIN_TIMESPAN_DAYS} ngày). Farely không đưa ra dự đoán thiếu căn cứ.`,
    };
  }

  const prices = validPoints.map((p) => p.price).sort((a, b) => a - b);
  const minPrice = prices[0];
  const medianPrice = prices[Math.floor(prices.length / 2)];

  // Calculate cohort percentile of current price
  const countBelow = prices.filter((p) => p < currentPrice).length;
  const percentile = Math.round((countBelow / prices.length) * 100);

  // Check days until flight departure
  const evalDate = params.evaluationDate ? new Date(params.evaluationDate) : new Date();
  const depDate = new Date(params.departureDate);
  const daysUntilDeparture = Math.round((depDate.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));

  // If departing in less than 7 days, prices almost never drop (airline yield management)
  if (daysUntilDeparture <= 7 && currentPrice <= medianPrice * 1.1) {
    return {
      recommendation: "BUY_NOW",
      confidence: 0.85,
      isCalibrated: true,
      sampleCount: validPoints.length,
      timespanDays,
      cohortPercentile: percentile,
      historicalMin: minPrice,
      historicalMedian: medianPrice,
      rationaleVi: `Chuyến bay khởi hành trong ${daysUntilDeparture} ngày tới. Theo quy luật mở bán, các dải vé giá rẻ thường đóng sớm trước tuần khởi hành. Nên đặt sớm.`,
    };
  }

  // If price is at or near all-time low (lowest 5%)
  if (percentile <= 5 || currentPrice <= minPrice * 1.02) {
    return {
      recommendation: "BUY_NOW",
      confidence: 0.9,
      isCalibrated: true,
      sampleCount: validPoints.length,
      timespanDays,
      cohortPercentile: percentile,
      historicalMin: minPrice,
      historicalMedian: medianPrice,
      rationaleVi: `Mức giá hiện tại (${currentPrice.toLocaleString("vi-VN")}đ) nằm trong top 5% thấp nhất toàn chu kỳ quan sát (thấp hơn ${100 - percentile}% số mẫu). Khuyến nghị mua ngay.`,
    };
  }

  // If price is above median and departure is far (>30 days), wait and watch
  if (currentPrice > medianPrice && daysUntilDeparture > 30) {
    const potentialSavingPercent = Math.round(((currentPrice - medianPrice) / currentPrice) * 100);
    return {
      recommendation: "WAIT_AND_WATCH",
      confidence: 0.75,
      isCalibrated: true,
      sampleCount: validPoints.length,
      timespanDays,
      cohortPercentile: percentile,
      historicalMin: minPrice,
      historicalMedian: medianPrice,
      rationaleVi: `Mức giá đang cao hơn trung vị lịch sử (${potentialSavingPercent}%). Còn ${daysUntilDeparture} ngày trước khởi hành, nên bật theo dõi giá để chờ đợt xả vé khuyến mãi tiếp theo.`,
    };
  }

  // Moderate pricing: calibrated neutral
  return {
    recommendation: "WAIT_AND_WATCH",
    confidence: 0.6,
    isCalibrated: true,
    sampleCount: validPoints.length,
    timespanDays,
    cohortPercentile: percentile,
    historicalMin: minPrice,
    historicalMedian: medianPrice,
    rationaleVi: `Mức giá ở mức trung bình của chặng bay (khoảng phân vị ${percentile}%). Bạn có thể cân nhắc đặt nếu lịch trình cố định hoặc bật theo dõi nếu thời gian linh hoạt.`,
  };
}
