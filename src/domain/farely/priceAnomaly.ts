/**
 * FARELY ROBUST PRICE ANOMALY DETECTION
 * 
 * Satisfies:
 * - F37 (P2): Price anomaly detection
 * 
 * INVARIANTS:
 * - "Never make strong anomaly claims on insufficient sample."
 * - Minimum 10 independent observation samples required before declaring a statistical anomaly.
 * - Sparse data (< 10) must return SPARSE_DATA_ABSTENTION.
 * - Distinguish genuine airline price drops from data glitches (zero fare, negative, 10x spikes).
 */

export type AnomalyClassification =
  | "STRONG_DROP_ANOMALY"
  | "MODERATE_DROP_ANOMALY"
  | "NORMAL_FLUCTUATION"
  | "SUSPECTED_DATA_GLITCH"
  | "SPARSE_DATA_ABSTENTION"
  | "INSUFFICIENT_DISPERSION_ABSTENTION";

export type PriceAnomalyScope = "ROUTE_LEVEL" | "IDENTICAL_OFFER" | "COHORT";

export interface AnomalyEvaluation {
  classification: AnomalyClassification;
  sampleSize: number;
  medianPrice: number;
  mad: number; // Median Absolute Deviation
  modifiedZScore: number;
  discountVsMedianPercent: number;
  isActionableDeal: boolean;
  explanationVi: string;
  cohortScope?: PriceAnomalyScope;
}

export const MIN_ANOMALY_SAMPLE_SIZE = 10;
export const MAX_COHORT_ANALYSIS_SIZE = 250;

/**
 * Static Tet (Vietnamese Lunar New Year) travel windows (2025–2027).
 * Trunk domestic routes during these periods experience ~2.8x seasonal baseline price inflation.
 */
export const TET_WINDOWS = [
  { start: "2025-01-15", end: "2025-02-15" },
  { start: "2026-02-03", end: "2026-03-05" },
  { start: "2027-01-24", end: "2027-02-24" },
];

/**
 * Checks whether a given flight departure date falls within a recognized peak Tet window.
 */
export function isTetDeparture(departureDate?: string): boolean {
  if (!departureDate) return false;
  const dateStr = departureDate.slice(0, 10);
  return TET_WINDOWS.some((w) => dateStr >= w.start && dateStr <= w.end);
}

/**
 * Calculates Median of an array of numbers.
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Evaluates whether a fare observation is a genuine statistical price anomaly
 * using Median Absolute Deviation (MAD) robust statistics.
 * Distinguishes route trends from identical offer cohorts (AUD-04).
 */
export function detectPriceAnomaly(params: {
  currentPrice: number;
  historicalCohortPrices: number[];
  cohortScope?: PriceAnomalyScope;
  departureDate?: string;
}): AnomalyEvaluation {
  const cohortScope = params.cohortScope || "ROUTE_LEVEL";
  const currentPrice = Number(params.currentPrice);

  // Glitch check: negative or non-finite
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return {
      classification: "SUSPECTED_DATA_GLITCH",
      sampleSize: 0,
      medianPrice: 0,
      mad: 0,
      modifiedZScore: 0,
      discountVsMedianPercent: 0,
      isActionableDeal: false,
      explanationVi: "Giá vé không hợp lệ (nhỏ hơn hoặc bằng 0). Phân loại là lỗi dữ liệu.",
      cohortScope,
    };
  }

  const rawCohort = (params.historicalCohortPrices || []).filter(
    (p) => Number.isFinite(p) && p > 0
  );
  const validCohort = rawCohort.slice(0, MAX_COHORT_ANALYSIS_SIZE);

  // F37 Invariant: Never make strong anomaly claims on insufficient sample
  if (validCohort.length < MIN_ANOMALY_SAMPLE_SIZE) {
    return {
      classification: "SPARSE_DATA_ABSTENTION",
      sampleSize: validCohort.length,
      medianPrice: validCohort.length > 0 ? calculateMedian(validCohort) : 0,
      mad: 0,
      modifiedZScore: 0,
      discountVsMedianPercent: 0,
      isActionableDeal: false,
      explanationVi: `Số mẫu quan sát (${validCohort.length}/${MIN_ANOMALY_SAMPLE_SIZE}) chưa đủ để kết luận bất thường giá thống kê. Hệ thống từ chối đưa ra nhận định đột biến.`,
      cohortScope,
    };
  }

  const median = calculateMedian(validCohort);

  // Glitch check: impossibly small (< 5% of median) or massive price (> 10x median)
  if (currentPrice < median * 0.05 || currentPrice > median * 10) {
    return {
      classification: "SUSPECTED_DATA_GLITCH",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad: 0,
      modifiedZScore: 99,
      discountVsMedianPercent: 0,
      isActionableDeal: false,
      explanationVi: "Mức giá lệch cực đoan bất thường (>10 lần hoặc thấp hơn 5% trung vị). Cần kiểm tra lại nguồn cấp dữ liệu.",
      cohortScope,
    };
  }

  // Calculate Median Absolute Deviation (MAD)
  const deviations = validCohort.map((p) => Math.abs(p - median));
  const rawMad = calculateMedian(deviations);

  // AUD-12: If the historical cohort is homogeneous (rawMad < 1e-6), there is zero empirical dispersion.
  // Invariant: Do NOT fabricate synthetic dispersion (e.g. median * 0.05). Classify as NORMAL_FLUCTUATION or INSUFFICIENT_DISPERSION_ABSTENTION without synthetic Z-score.
  if (rawMad < 1e-6) {
    const discountVsMedianPercent = median > 0 ? Math.round(((median - currentPrice) / median) * 100) : 0;
    // EV-22: If MAD = 0 and price differs materially (>= 25%), do NOT automatically classify as NORMAL_FLUCTUATION
    if (Math.abs(discountVsMedianPercent) >= 25) {
      return {
        classification: "INSUFFICIENT_DISPERSION_ABSTENTION",
        sampleSize: validCohort.length,
        medianPrice: median,
        mad: 0,
        modifiedZScore: 0,
        discountVsMedianPercent,
        isActionableDeal: false,
        explanationVi: "Mức giá thay đổi lớn nhưng tập dữ liệu không có độ phân tán (MAD = 0). Hệ thống bảo lưu kết luận để tránh phân loại sai lệch.",
        cohortScope,
      };
    }

    return {
      classification: "NORMAL_FLUCTUATION",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad: 0,
      modifiedZScore: 0,
      discountVsMedianPercent,
      isActionableDeal: false,
      explanationVi: "Tập dữ liệu lịch sử đồng nhất (độ phân tán MAD = 0). Hệ thống không tự chế tác độ phân tán giả lập để suy diễn bất thường.",
      cohortScope,
    };
  }

  const mad = rawMad;

  // Boris Iglewicz and David Hoaglin modified Z-score: 0.6745 * (x - median) / MAD
  // If departure is during peak Tet holiday, historical baseline median is scaled by 2.8x seasonal prior
  const seasonalMultiplier = params.departureDate && isTetDeparture(params.departureDate) ? 2.8 : 1.0;
  const effectiveMedian = median * seasonalMultiplier;
  const modifiedZScore = (0.6745 * (currentPrice - effectiveMedian)) / mad;
  const discountVsMedianPercent = effectiveMedian > 0 ? Math.round(((effectiveMedian - currentPrice) / effectiveMedian) * 100) : 0;

  // Strong drop anomaly: z-score < -2.5 and discount >= 20%
  if (modifiedZScore <= -2.5 && discountVsMedianPercent >= 20) {
    const explanationVi = cohortScope === "IDENTICAL_OFFER"
      ? `Giá chuyến bay giảm đột biến mạnh so với lịch sử (thấp hơn trung vị ${discountVsMedianPercent}%, độ lệch chuẩn MAD z-score ${modifiedZScore.toFixed(2)}). Đây là cơ hội vé giá rẻ vượt trội của chính chuyến bay này.`
      : cohortScope === "COHORT"
      ? `Giá giảm đột biến mạnh trong nhóm vé tương đương (thấp hơn trung vị ${discountVsMedianPercent}%, độ lệch chuẩn MAD z-score ${modifiedZScore.toFixed(2)}).`
      : `Giá giảm đột biến mạnh trên toàn chặng (thấp hơn trung vị ${discountVsMedianPercent}%, độ lệch chuẩn MAD z-score ${modifiedZScore.toFixed(2)}). Đây là cơ hội vé giá rẻ vượt trội.`;

    return {
      classification: "STRONG_DROP_ANOMALY",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad,
      modifiedZScore,
      discountVsMedianPercent,
      isActionableDeal: true,
      explanationVi,
      cohortScope,
    };
  }

  // Moderate drop anomaly: z-score < -1.5 and discount >= 10%
  if (modifiedZScore <= -1.5 && discountVsMedianPercent >= 10) {
    const explanationVi = cohortScope === "IDENTICAL_OFFER"
      ? `Giá chuyến bay thấp hơn mức thông thường (${discountVsMedianPercent}% so với trung vị), có xu hướng giảm đáng chú ý.`
      : cohortScope === "COHORT"
      ? `Giá thấp hơn mức thông thường trong nhóm vé tương đương (${discountVsMedianPercent}% so với trung vị).`
      : `Giá thấp hơn mức thông thường trên chặng (${discountVsMedianPercent}% so với trung vị), có xu hướng giảm đáng chú ý.`;

    return {
      classification: "MODERATE_DROP_ANOMALY",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad,
      modifiedZScore,
      discountVsMedianPercent,
      isActionableDeal: true,
      explanationVi,
      cohortScope,
    };
  }

  return {
    classification: "NORMAL_FLUCTUATION",
    sampleSize: validCohort.length,
    medianPrice: median,
    mad,
    modifiedZScore,
    discountVsMedianPercent,
    isActionableDeal: false,
    explanationVi: cohortScope === "IDENTICAL_OFFER"
      ? "Mức giá nằm trong dải dao động thông thường của chuyến bay này."
      : "Mức giá nằm trong dải dao động thông thường của đường bay.",
    cohortScope,
  };
}

/**
 * Calculates unbiased sample standard deviation using Bessel's correction (N - 1).
 * Guards against division by zero when sample size N <= 1.
 */
export function calculateSampleStandardDeviation(prices: number[]): {
  mean: number;
  sampleVariance: number;
  sampleStdDev: number;
} {
  const n = prices.length;
  if (n <= 1) {
    return { mean: prices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 };
  }
  const mean = prices.reduce((a, b) => a + b, 0) / n;
  const sumSquaredDiffs = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0);
  const sampleVariance = Math.round(sumSquaredDiffs / (n - 1)); // Bessel's correction
  return {
    mean,
    sampleVariance,
    sampleStdDev: Math.sqrt(sampleVariance),
  };
}

/**
 * Checks whether a series of observed historical prices exhibits zero empirical dispersion (sample variance < 1e-6).
 */
export function hasZeroDispersion(prices: number[]): boolean {
  if (!prices || prices.length <= 1) return true;
  const { sampleVariance } = calculateSampleStandardDeviation(prices);
  return sampleVariance < 1e-6;
}

