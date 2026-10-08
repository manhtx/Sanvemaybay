/**
 * Farely Pure Domain Kernel — Watch Condition Episodes
 * REQ-DATA-004, REQ-WATCH-015, REQ-WATCH-016, REQ-WATCH-017, REQ-WATCH-018
 * NC-017, NC-018, NC-019
 */

export type EpisodeState =
  | 'ENTERED'
  | 'STILL_INSIDE'
  | 'MATERIAL_IMPROVEMENT'
  | 'EXITED'
  | 'REENTERED';

export interface WatchConditionEpisode {
  id: string;
  watchId: string;
  conditionFingerprint: string;
  openedAt: string;
  closedAt: string | null;
  state: EpisodeState;
  entryPrice: number;
  bestPrice: number;
  lastEventAt: string;
  generationId?: string;
}

export interface EpisodeEvaluationResult {
  nextEpisode: WatchConditionEpisode | null;
  stateChanged: boolean;
  shouldAlert: boolean;
  transitionReason: string;
}

/**
 * Evaluates watch condition episode state transition against a newly observed price.
 * Invariants:
 * - NC-017: Price exits target price -> episode EXITED.
 * - NC-018: Price re-enters -> new valid episode (REENTERED).
 * - NC-019: Material price drop (>5% drop from previous best) inside condition triggers alert.
 */
export type WatchConditionInput = 'MATCH' | 'CONFIRMED_NON_MATCH' | 'INSUFFICIENT_EVIDENCE';

export function evaluateWatchCondition(params: {
  watchId: string;
  targetPrice: number;
  observedPrice?: number | null;
  conditionInput?: WatchConditionInput;
  activeEpisode: WatchConditionEpisode | null;
  generationId?: string;
  now?: string;
}): EpisodeEvaluationResult {
  const now = params.now || new Date().toISOString();
  const active = params.activeEpisode;

  // Case 0: INSUFFICIENT_EVIDENCE (F18) - Preserve active episode state intact; never false EXIT
  if (
    params.conditionInput === 'INSUFFICIENT_EVIDENCE' ||
    params.observedPrice == null ||
    !Number.isFinite(params.observedPrice)
  ) {
    return {
      nextEpisode: active,
      stateChanged: false,
      shouldAlert: false,
      transitionReason: 'INSUFFICIENT_EVIDENCE: Scope unmonitored or no observations. Episode state preserved intact.'
    };
  }

  const isEligible = params.conditionInput === 'MATCH' ||
    (params.conditionInput !== 'CONFIRMED_NON_MATCH' && (params.observedPrice as number) <= params.targetPrice);

  // Case 1: Price is confirmed above target price (CONFIRMED_NON_MATCH)
  if (!isEligible) {
    if (active && active.state !== 'EXITED') {
      // NC-017: Price leaves target -> episode EXITED
      return {
        nextEpisode: {
          ...active,
          closedAt: now,
          state: 'EXITED',
          lastEventAt: now
        },
        stateChanged: true,
        shouldAlert: false,
        transitionReason: `Price increased above target (${params.observedPrice} > ${params.targetPrice}). Episode EXITED.`
      };
    }
    return {
      nextEpisode: active,
      stateChanged: false,
      shouldAlert: false,
      transitionReason: 'Price remains above target. No active episode.'
    };
  }

  // Case 2: Price is within target price (eligible)
  // Sub-case 2a: No previous active episode, or previously exited
  if (!active || active.state === 'EXITED') {
    const isReentry = !!(active && active.state === 'EXITED');
    const newState: EpisodeState = isReentry ? 'REENTERED' : 'ENTERED';
    const newEpisode: WatchConditionEpisode = {
      id: `ep_${params.watchId}_${Date.now()}`,
      watchId: params.watchId,
      conditionFingerprint: `cond_${params.watchId}_${params.targetPrice}`,
      openedAt: now,
      closedAt: null,
      state: newState,
      entryPrice: params.observedPrice,
      bestPrice: params.observedPrice,
      lastEventAt: now,
      generationId: params.generationId
    };

    return {
      nextEpisode: newEpisode,
      stateChanged: true,
      shouldAlert: true, // First entry or re-entry creates alert
      transitionReason: isReentry
        ? `NC-018: Price dropped back below target (${params.observedPrice} <= ${params.targetPrice}). REENTERED.`
        : `Price met target (${params.observedPrice} <= ${params.targetPrice}). ENTERED.`
    };
  }

  // Sub-case 2b: Already inside active episode
  // Check for material improvement (NC-019: drop of at least 5% below previous best)
  const dropPercent = ((active.bestPrice - params.observedPrice) / active.bestPrice) * 100;
  if (dropPercent >= 5) {
    return {
      nextEpisode: {
        ...active,
        bestPrice: params.observedPrice,
        state: 'MATERIAL_IMPROVEMENT',
        lastEventAt: now,
        generationId: params.generationId
      },
      stateChanged: true,
      shouldAlert: true, // NC-019: Material improvement inside condition triggers re-alert
      transitionReason: `NC-019: Material price drop of ${Math.round(dropPercent)}% to ${params.observedPrice}. MATERIAL_IMPROVEMENT.`
    };
  }

  // Sub-case 2c: Still inside with minor or no improvement
  const updatedBest = Math.min(active.bestPrice, params.observedPrice);
  return {
    nextEpisode: {
      ...active,
      bestPrice: updatedBest,
      state: 'STILL_INSIDE',
      lastEventAt: now,
      generationId: params.generationId
    },
    stateChanged: false,
    shouldAlert: false, // Suppress alert spam for identical or minor fluctuations
    transitionReason: `Price remains below target (${params.observedPrice} <= ${params.targetPrice}). STILL_INSIDE.`
  };
}
