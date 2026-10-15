/**
 * F38: Personalized Travel Feed Privacy & Non-Profiling (Tier P2)
 *
 * Requirements:
 * - Solution: Explicit preference opt-in, privacy controls and controlled retention/saved-outcome evaluation.
 * - Acceptance Invariant: No sensitive inference or covert profiling.
 */

export class CovertProfilingViolationError extends Error {
  constructor(message: string) {
    super(`[F38_COVERT_PROFILING_VIOLATION] ${message}`);
    this.name = 'CovertProfilingViolationError';
  }
}

export interface ExplicitUserPreferences {
  isPersonalizationOptedIn: boolean; // Must be explicit; never covert
  homeAirports?: string[];
  preferredAirlines?: string[];
  maxBudgetVND?: number;
  maxStops?: number;
}

export interface FeedCandidateDeal {
  id: string;
  originCode: string;
  destinationCode: string;
  airlineCode: string;
  priceVND: number;
  objectiveDealScore: number;
  stops: number;
}

export interface RankedFeedItem {
  deal: FeedCandidateDeal;
  displayRank: number;
  isPersonalizedPromotion: boolean;
  rankingRationaleVi: string;
}

// Prohibited demographic and covert profiling attributes
const SENSITIVE_PROFILING_KEYS = [
  'inferredIncomeTier',
  'inferredReligion',
  'inferredEthnicity',
  'inferredPoliticalStance',
  'inferredHealthStatus',
  'covertDeviceFingerprint',
  'surveillanceCohortId',
  'inferredMaritalStatus',
  'creditWorthinessScore',
] as const;

/**
 * Validates and cleanses user context, strictly rejecting any covert or sensitive inferences (F38).
 */
export function sanitizePersonalizationContext(contextPayload: Record<string, unknown>): void {
  for (const key of Object.keys(contextPayload)) {
    if (SENSITIVE_PROFILING_KEYS.includes(key as any)) {
      throw new CovertProfilingViolationError(
        `Personalization context contains forbidden sensitive/covert inference key: "${key}". Farely strictly prohibits covert profiling or sensitive demographic inference.`
      );
    }
  }
}

/**
 * Ranks deals for travel feed using strictly explicit preferences.
 * When personalization is disabled or unconsented, falls back to objective deal score.
 */
export function rankFeedWithPrivacyGuarantees(params: {
  deals: FeedCandidateDeal[];
  preferences: ExplicitUserPreferences;
  contextPayload?: Record<string, unknown>;
}): RankedFeedItem[] {
  const { deals, preferences, contextPayload = {} } = params;

  // 1. Invariant check: Assert no covert profiling attributes exist
  sanitizePersonalizationContext(contextPayload);

  if (!deals || deals.length === 0) {
    return [];
  }

  // 2. If user has NOT explicitly opted into personalization, return pure objective ranking
  if (!preferences.isPersonalizationOptedIn) {
    const sorted = [...deals].sort((a, b) => b.objectiveDealScore - a.objectiveDealScore);
    return sorted.map((deal, idx) => ({
      deal,
      displayRank: idx + 1,
      isPersonalizedPromotion: false,
      rankingRationaleVi: `Xếp hạng theo Điểm cơ hội khách quan (#${deal.objectiveDealScore}/100)`,
    }));
  }

  // 3. User opted in: Calculate ranking based ONLY on declared explicit criteria
  const scoredDeals = deals.map((deal) => {
    let score = deal.objectiveDealScore;
    const rationales: string[] = [];

    // Origin airport match
    if (preferences.homeAirports && preferences.homeAirports.includes(deal.originCode)) {
      score += 20;
      rationales.push(`Khởi hành từ sân bay bạn quan tâm (${deal.originCode})`);
    }

    // Airline match
    if (preferences.preferredAirlines && preferences.preferredAirlines.includes(deal.airlineCode)) {
      score += 15;
      rationales.push(`Hãng bay ưu thích (${deal.airlineCode})`);
    }

    // Budget match
    if (preferences.maxBudgetVND && deal.priceVND <= preferences.maxBudgetVND) {
      score += 10;
      rationales.push('Trong ngân sách đã đặt');
    }

    // Stop count filter
    if (preferences.maxStops !== undefined && deal.stops <= preferences.maxStops) {
      score += 5;
      rationales.push('Phù hợp số điểm dừng');
    }

    const isPromoted = rationales.length > 0;
    const rationaleText = isPromoted
      ? `Phù hợp sở thích đã chọn: ${rationales.join(' · ')}`
      : `Điểm cơ hội khách quan (#${deal.objectiveDealScore}/100)`;

    return {
      deal,
      compositeScore: score,
      isPersonalizedPromotion: isPromoted,
      rankingRationaleVi: rationaleText,
    };
  });

  scoredDeals.sort((a, b) => b.compositeScore - a.compositeScore);

  return scoredDeals.map((item, idx) => ({
    deal: item.deal,
    displayRank: idx + 1,
    isPersonalizedPromotion: item.isPersonalizedPromotion,
    rankingRationaleVi: item.rankingRationaleVi,
  }));
}
