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
  isPersonalizationOptedIn: boolean; // Must be explicit boolean true; never covert
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
  personalizedScoreDelta?: number;
  matchedPreferenceRules?: string[];
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

const NORMALIZED_PROHIBITED_KEYS = new Set(
  SENSITIVE_PROFILING_KEYS.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
);

/**
 * Validates and cleanses user context, strictly rejecting any covert or sensitive inferences (F38).
 * Hardened with cycle-safe recursive traversal, prototype pollution defense, and deep array inspection.
 */
export function sanitizePersonalizationContext(contextPayload: unknown): void {
  if (!contextPayload || typeof contextPayload !== 'object') {
    return;
  }

  const visited = new Set<unknown>();

  function traverse(target: unknown, depth: number): void {
    if (depth > 8) return; // bounded depth recursion guard
    if (!target || typeof target !== 'object') return;
    if (visited.has(target)) return; // cycle detection
    visited.add(target);

    if (Array.isArray(target)) {
      for (const item of target) {
        traverse(item, depth + 1);
      }
      return;
    }

    for (const key of Object.keys(target as Record<string, unknown>)) {
      // Prototype pollution defense
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (NORMALIZED_PROHIBITED_KEYS.has(normalizedKey)) {
        throw new CovertProfilingViolationError(
          `Personalization context contains forbidden sensitive/covert inference key: "${key}". Farely strictly prohibits covert profiling or sensitive demographic inference.`
        );
      }

      const value = (target as Record<string, unknown>)[key];
      traverse(value, depth + 1);
    }
  }

  traverse(contextPayload, 0);
}

/**
 * Ranks deals for travel feed using strictly explicit preferences.
 * When personalization is disabled or unconsented (strict boolean check), falls back to objective deal score.
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

  // 2. Strict affirmative consent: must be boolean true (Decree 13/2023/ND-CP)
  if (preferences.isPersonalizationOptedIn !== true) {
    const sorted = [...deals].sort((a, b) => {
      if (b.objectiveDealScore !== a.objectiveDealScore) {
        return b.objectiveDealScore - a.objectiveDealScore;
      }
      return a.id.localeCompare(b.id);
    });
    return sorted.map((deal, idx) => ({
      deal,
      displayRank: idx + 1,
      isPersonalizedPromotion: false,
      rankingRationaleVi: `Xếp hạng theo Điểm cơ hội khách quan (#${deal.objectiveDealScore}/100)`,
    }));
  }

  // 3. User opted in: Calculate ranking based ONLY on declared explicit criteria
  const homeAirports = (preferences.homeAirports || []).slice(0, 10);
  const preferredAirlines = (preferences.preferredAirlines || []).slice(0, 20);

  const scoredDeals = deals.map((deal) => {
    let score = deal.objectiveDealScore;
    const rationales: string[] = [];
    const matchedRules: string[] = [];

    // Origin airport match
    if (homeAirports.length > 0 && homeAirports.includes(deal.originCode)) {
      score += 20;
      rationales.push(`Khởi hành từ sân bay bạn quan tâm (${deal.originCode})`);
      matchedRules.push(`HOME_AIRPORT_${deal.originCode}`);
    }

    // Airline match
    if (preferredAirlines.length > 0 && preferredAirlines.includes(deal.airlineCode)) {
      score += 15;
      rationales.push(`Hãng bay ưu thích (${deal.airlineCode})`);
      matchedRules.push(`PREFERRED_AIRLINE_${deal.airlineCode}`);
    }

    // Budget match
    if (
      preferences.maxBudgetVND !== undefined &&
      Number.isInteger(preferences.maxBudgetVND) &&
      preferences.maxBudgetVND > 0 &&
      deal.priceVND <= preferences.maxBudgetVND
    ) {
      score += 10;
      rationales.push('Trong ngân sách đã đặt');
      matchedRules.push('BUDGET_COMPLIANT');
    }

    // Stop count filter - accurately handles maxStops = 0 (direct flight preference)
    if (
      preferences.maxStops !== undefined &&
      Number.isInteger(preferences.maxStops) &&
      preferences.maxStops >= 0 &&
      deal.stops <= preferences.maxStops
    ) {
      score += 5;
      rationales.push('Phù hợp số điểm dừng');
      matchedRules.push(`MAX_STOPS_${preferences.maxStops}`);
    }

    // SOL-PRIVACY-01: Cap total personalization boost at 35 points to maintain objective opportunity primacy
    const rawDelta = score - deal.objectiveDealScore;
    const cappedDelta = Math.min(35, Math.max(0, rawDelta));
    const compositeScore = Math.min(100, deal.objectiveDealScore + cappedDelta);

    const isPromoted = rationales.length > 0;
    const rationaleText = isPromoted
      ? `Phù hợp sở thích đã chọn: ${rationales.join(' · ')}`
      : `Điểm cơ hội khách quan (#${deal.objectiveDealScore}/100)`;

    return {
      deal,
      compositeScore,
      personalizedScoreDelta: cappedDelta,
      matchedPreferenceRules: matchedRules,
      isPersonalizedPromotion: isPromoted,
      rankingRationaleVi: rationaleText,
    };
  });

  // Multi-tier deterministic tie-breaking: compositeScore DESC -> priceVND ASC -> id ASC
  scoredDeals.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    if (a.deal.priceVND !== b.deal.priceVND) {
      return a.deal.priceVND - b.deal.priceVND;
    }
    return a.deal.id.localeCompare(b.deal.id);
  });

  return scoredDeals.map((item, idx) => ({
    deal: item.deal,
    displayRank: idx + 1,
    isPersonalizedPromotion: item.isPersonalizedPromotion,
    rankingRationaleVi: item.rankingRationaleVi,
    personalizedScoreDelta: item.personalizedScoreDelta,
    matchedPreferenceRules: item.matchedPreferenceRules,
  }));
}
