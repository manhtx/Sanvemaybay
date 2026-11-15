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

const DURATION_CACHE = new Map<string, number | undefined>();
const OBS_TIME_CACHE = new Map<string, number>();

export function computeDurationDays(departDate: string, returnDate?: string | null): number | undefined {
  if (!returnDate) return undefined;
  const key = `${departDate}_${returnDate}`;
  const cached = DURATION_CACHE.get(key);
  if (cached !== undefined) return cached;

  const dep = new Date(departDate).getTime();
  const ret = new Date(returnDate).getTime();
  let result: number | undefined = undefined;
  if (!isNaN(dep) && !isNaN(ret) && ret >= dep) {
    result = Math.round((ret - dep) / (1000 * 60 * 60 * 24));
  }
  if (DURATION_CACHE.size < 10000) {
    DURATION_CACHE.set(key, result);
  }
  return result;
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

function calculateMedianFromObs(validCohort: ObservationData[]): number {
  const len = validCohort.length;
  if (len === 0) return 0;
  if (len === 1) return validCohort[0].price;
  const p = new Float64Array(len);
  for (let i = 0; i < len; i++) p[i] = validCohort[i].price;
  p.sort();
  const mid = Math.floor(len / 2);
  return len % 2 !== 0 ? p[mid] : Math.round((p[mid - 1] + p[mid]) / 2);
}

export function evaluateCohortComparison(
  current: ObservationData,
  cohortObservations: ObservationData[],
  nowMs = Date.now(),
): CohortComparison {
  const criteria = extractCohortCriteria(current);
  const cohortKey = buildCohortKey(criteria);

  const originUpper = criteria.originCode.toUpperCase();
  const destUpper = criteria.destinationCode.toUpperCase();
  const tripType = criteria.tripType;
  const departMonth = criteria.departMonth;
  const stopsClass = criteria.stopsClass;
  const durationDaysBucket = criteria.durationDaysBucket;

  // Filter valid observations in the same cohort with direct field checks
  const validCohort: ObservationData[] = [];
  for (let i = 0; i < cohortObservations.length; i++) {
    const obs = cohortObservations[i];
    const price = obs.price;
    if (price <= 0 || !Number.isFinite(price)) continue;
    if (obs.originCode.toUpperCase() !== originUpper) continue;
    if (obs.destinationCode.toUpperCase() !== destUpper) continue;
    const isRoundtrip = Boolean(obs.returnDate && obs.returnDate.trim());
    if ((isRoundtrip ? "roundtrip" : "oneway") !== tripType) continue;
    if (obs.departDate.slice(0, 7) !== departMonth) continue;
    const obsStops = (obs.stops ?? 0) === 0 ? "direct" : "connecting";
    if (obsStops !== stopsClass) continue;
    if (isRoundtrip && obs.returnDate) {
      const days = computeDurationDays(obs.departDate, obs.returnDate);
      const obsBucket = days != null ? (days <= 4 ? "short" : days <= 8 ? "medium" : "long") : undefined;
      if (obsBucket !== durationDaysBucket) continue;
    }
    validCohort.push(obs);
  }

  const sampleSize = validCohort.length;
  const currentPrice = current.price;

  // Calculate distinct scan epochs or observation dates without Set allocation for small cohorts
  let scanEpochCount = 1;
  if (sampleSize > 1) {
    if (sampleSize <= 8) {
      let e0 = "", e1 = "", e2 = "", e3 = "";
      let count = 0;
      for (let i = 0; i < sampleSize; i++) {
        const obs = validCohort[i];
        const e = obs.scanRunId || (obs.observedAt ? obs.observedAt.slice(0, 10) : "");
        if (e && e !== e0 && e !== e1 && e !== e2 && e !== e3) {
          if (count === 0) e0 = e;
          else if (count === 1) e1 = e;
          else if (count === 2) e2 = e;
          else if (count === 3) e3 = e;
          count++;
        }
      }
      scanEpochCount = Math.max(1, count);
    } else {
      const epochs = new Set<string>();
      for (let i = 0; i < sampleSize; i++) {
        const obs = validCohort[i];
        if (obs.scanRunId) epochs.add(obs.scanRunId);
        else if (obs.observedAt) epochs.add(obs.observedAt.slice(0, 10));
      }
      scanEpochCount = Math.max(1, epochs.size);
    }
  }

  let obsTime = nowMs;
  if (current.observedAt) {
    let t = OBS_TIME_CACHE.get(current.observedAt);
    if (t === undefined) {
      t = new Date(current.observedAt).getTime();
      if (OBS_TIME_CACHE.size < 10000) OBS_TIME_CACHE.set(current.observedAt, t);
    }
    obsTime = t;
  }
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

  const cohortMedian = calculateMedianFromObs(validCohort);
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
