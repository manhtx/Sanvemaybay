/**
 * Comparable Cohort & Opportunity Decision Intelligence Model
 * Implements defensible cohort comparisons and evidence evaluation.
 */

export interface ComparableCohortCriteria {
  originCode: string;
  destinationCode: string;
  tripType: "oneway" | "roundtrip";
  departMonth: string; // YYYY-MM
  durationDaysBucket?: "short" | "medium" | "long"; // <=4 days, 5-8 days, >8 days for roundtrips
  stopsClass: "direct" | "connecting";
  carrierClass?: "budget" | "legacy" | "mixed";
}

export interface ObservationData {
  id: string;
  originCode: string;
  destinationCode: string;
  departDate: string;
  returnDate?: string | null;
  price: number;
  stops: number;
  airlineCode?: string;
  observedAt: string;
  scanRunId?: string;
}

export type EvidenceTier = "STRONG" | "MODERATE" | "ACCUMULATING";

export interface EvidenceProfile {
  tier: EvidenceTier;
  label: string; // "BẰNG CHỨNG MẠNH" | "BẰNG CHỨNG VỪA" | "ĐANG TÍCH LŨY BẰNG CHỨNG"
  sampleCount: number;
  scanEpochCount: number;
  freshnessMinutes: number;
  summaryText: string; // e.g. "8 quan sát · 3 lượt quét · 18 phút trước"
}

export interface CohortComparison {
  cohortKey: string;
  sampleSize: number;
  cohortMedian: number | null;
  currentPrice: number;
  deltaPercent: number | null; // positive = cheaper than median, null when insufficient
  isDiscounted: boolean;
  isSufficient: boolean;
  comparisonExplanation: string; // e.g. "22% thấp hơn median của 14 mức giá tương đương Farely đã quan sát."
  evidence: EvidenceProfile;
}

export function computeDurationDays(departDate: string, returnDate?: string | null): number | undefined {
  if (!returnDate) return undefined;
  const dep = new Date(departDate).getTime();
  const ret = new Date(returnDate).getTime();
  if (isNaN(dep) || isNaN(ret) || ret < dep) return undefined;
  return Math.round((ret - dep) / (1000 * 60 * 60 * 24));
}

export function buildCohortKey(criteria: ComparableCohortCriteria): string {
  const parts = [
    criteria.originCode.toUpperCase(),
    criteria.destinationCode.toUpperCase(),
    criteria.tripType,
    criteria.departMonth,
    criteria.stopsClass,
  ];
  if (criteria.durationDaysBucket) parts.push(criteria.durationDaysBucket);
  return parts.join(":");
}

export function extractCohortCriteria(observation: Pick<ObservationData, "originCode" | "destinationCode" | "departDate" | "returnDate" | "stops">): ComparableCohortCriteria {
  const isRoundtrip = Boolean(observation.returnDate && observation.returnDate.trim());
  const departMonth = observation.departDate.slice(0, 7);
  const stopsClass = (observation.stops ?? 0) === 0 ? "direct" : "connecting";

  let durationDaysBucket: "short" | "medium" | "long" | undefined;
  if (isRoundtrip && observation.returnDate) {
    const days = computeDurationDays(observation.departDate, observation.returnDate);
    if (days != null) {
      durationDaysBucket = days <= 4 ? "short" : days <= 8 ? "medium" : "long";
    }
  }

  return {
    originCode: observation.originCode,
    destinationCode: observation.destinationCode,
    tripType: isRoundtrip ? "roundtrip" : "oneway",
    departMonth,
    durationDaysBucket,
    stopsClass,
  };
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function evaluateCohortComparison(
  current: ObservationData,
  cohortObservations: ObservationData[],
  nowMs = Date.now(),
): CohortComparison {
  const criteria = extractCohortCriteria(current);
  const cohortKey = buildCohortKey(criteria);

  // Filter valid observations in the same cohort
  const validCohort = cohortObservations.filter((obs) => {
    if (!Number.isFinite(obs.price) || obs.price <= 0) return false;
    const obsCriteria = extractCohortCriteria(obs);
    return buildCohortKey(obsCriteria) === cohortKey;
  });

  const sampleSize = validCohort.length;
  const currentPrice = current.price;

  // Calculate distinct scan epochs or observation dates
  const epochs = new Set<string>();
  for (const obs of validCohort) {
    if (obs.scanRunId) epochs.add(obs.scanRunId);
    else if (obs.observedAt) epochs.add(obs.observedAt.slice(0, 10));
  }
  const scanEpochCount = Math.max(1, epochs.size);

  const obsTime = current.observedAt ? new Date(current.observedAt).getTime() : nowMs;
  const freshnessMinutes = Math.max(0, Math.round((nowMs - obsTime) / (60 * 1000)));

  // Evidence tiering
  let tier: EvidenceTier = "ACCUMULATING";
  let label = "ĐANG TÍCH LŨY BẰNG CHỨNG";

  if (sampleSize >= 12 && scanEpochCount >= 3 && freshnessMinutes <= 180) {
    tier = "STRONG";
    label = "BẰNG CHỨNG MẠNH";
  } else if (sampleSize >= 5 && scanEpochCount >= 2) {
    tier = "MODERATE";
    label = "BẰNG CHỨNG VỪA";
  }

  const freshnessText =
    freshnessMinutes < 1
      ? "vừa xong"
      : freshnessMinutes < 60
      ? `${freshnessMinutes} phút trước`
      : `${Math.round(freshnessMinutes / 60)} giờ trước`;

  const summaryText = `${sampleSize} quan sát · ${scanEpochCount} lượt quét · ${freshnessText}`;

  const evidence: EvidenceProfile = {
    tier,
    label,
    sampleCount: sampleSize,
    scanEpochCount,
    freshnessMinutes,
    summaryText,
  };

  if (sampleSize < 5) {
    return {
      cohortKey,
      sampleSize,
      cohortMedian: null,
      currentPrice,
      deltaPercent: null,
      isDiscounted: false,
      isSufficient: false,
      comparisonExplanation: `Chưa đủ dữ liệu đối sánh (Farely cần tối thiểu 5 quan sát tương đương để tính mức giá tham chiếu, hiện có ${sampleSize}).`,
      evidence,
    };
  }

  const prices = validCohort.map((obs) => obs.price);
  const cohortMedian = calculateMedian(prices);
  const delta = Math.round(((cohortMedian - currentPrice) / cohortMedian) * 100);

  let comparisonExplanation = "";
  if (delta > 0) {
    comparisonExplanation = `${delta}% thấp hơn median của ${sampleSize} mức giá tương đương Farely đã quan sát.`;
  } else if (delta === 0) {
    comparisonExplanation = `Bằng mức giá median của ${sampleSize} mức giá tương đương Farely đã quan sát.`;
  } else {
    comparisonExplanation = `${Math.abs(delta)}% cao hơn median của ${sampleSize} mức giá tương đương (${sampleSize} quan sát).`;
  }

  return {
    cohortKey,
    sampleSize,
    cohortMedian,
    currentPrice,
    deltaPercent: delta,
    isDiscounted: delta >= 15,
    isSufficient: true,
    comparisonExplanation,
    evidence,
  };
}

export const buildComparableCohort = evaluateCohortComparison;
