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
  | "SPARSE_DATA_ABSTENTION";

export interface AnomalyEvaluation {
  classification: AnomalyClassification;
  sampleSize: number;
  medianPrice: number;
  mad: number; // Median Absolute Deviation
  modifiedZScore: number;
  discountVsMedianPercent: number;
  isActionableDeal: boolean;
  explanationVi: string;
}

export const MIN_ANOMALY_SAMPLE_SIZE = 10;

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
 */
export function detectPriceAnomaly(params: {
  currentPrice: number;
  historicalCohortPrices: number[];
}): AnomalyEvaluation {
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
    };
  }

  const validCohort = (params.historicalCohortPrices || []).filter(
    (p) => Number.isFinite(p) && p > 0
  );

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
    };
  }

  // Calculate Median Absolute Deviation (MAD)
  const deviations = validCohort.map((p) => Math.abs(p - median));
  const rawMad = calculateMedian(deviations);

  // AUD-12: If the historical cohort is homogeneous (rawMad === 0), there is zero empirical dispersion.
  // Invariant: Do NOT fabricate synthetic dispersion (e.g. median * 0.05). Classify as NORMAL_FLUCTUATION without synthetic Z-score.
  if (rawMad === 0) {
    const discountVsMedianPercent = median > 0 ? Math.round(((median - currentPrice) / median) * 100) : 0;
    return {
      classification: "NORMAL_FLUCTUATION",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad: 0,
      modifiedZScore: 0,
      discountVsMedianPercent,
      isActionableDeal: false,
      explanationVi: "Tập dữ liệu lịch sử đồng nhất (độ phân tán MAD = 0). Hệ thống không tự chế tác độ phân tán giả lập để suy diễn bất thường.",
    };
  }

  const mad = rawMad;

  // Boris Iglewicz and David Hoaglin modified Z-score: 0.6745 * (x - median) / MAD
  const modifiedZScore = (0.6745 * (currentPrice - median)) / mad;
  const discountVsMedianPercent = median > 0 ? Math.round(((median - currentPrice) / median) * 100) : 0;

  // Strong drop anomaly: z-score < -2.5 and discount >= 20%
  if (modifiedZScore <= -2.5 && discountVsMedianPercent >= 20) {
    return {
      classification: "STRONG_DROP_ANOMALY",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad,
      modifiedZScore,
      discountVsMedianPercent,
      isActionableDeal: true,
      explanationVi: `Giá giảm đột biến mạnh (thấp hơn trung vị ${discountVsMedianPercent}%, độ lệch chuẩn MAD z-score ${modifiedZScore.toFixed(2)}). Đây là cơ hội vé giá rẻ vượt trội.`,
    };
  }

  // Moderate drop anomaly: z-score < -1.5 and discount >= 10%
  if (modifiedZScore <= -1.5 && discountVsMedianPercent >= 10) {
    return {
      classification: "MODERATE_DROP_ANOMALY",
      sampleSize: validCohort.length,
      medianPrice: median,
      mad,
      modifiedZScore,
      discountVsMedianPercent,
      isActionableDeal: true,
      explanationVi: `Giá thấp hơn mức thông thường (${discountVsMedianPercent}% so với trung vị), có xu hướng giảm đáng chú ý.`,
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
    explanationVi: "Mức giá nằm trong dải dao động thông thường của đường bay.",
  };
}
