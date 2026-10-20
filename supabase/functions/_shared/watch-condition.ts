/**
 * Watch Condition Episodes & State Machine (REQ-DATA-004, REQ-WATCH-015..018, NC-017..019)
 * Universal across Deno Edge Functions and Node.
 */

export type EpisodeState =
  | 'ENTERED'
  | 'STILL_INSIDE'
  | 'MATERIAL_IMPROVEMENT'
  | 'EXITED'
  | 'REENTERED';

export interface WatchConditionEpisode {
  id: string;
  watch_id: string;
  condition_fingerprint: string;
  opened_at: string;
  closed_at: string | null;
  state: EpisodeState;
  entry_price: number;
  best_price: number;
  last_event_at: string;
  generation_id?: string | null;
}

export interface EpisodeEvaluationResult {
  nextEpisode: WatchConditionEpisode | null;
  stateChanged: boolean;
  shouldAlert: boolean;
  transitionReason: string;
}

export type WatchConditionInput = 'MATCH' | 'CONFIRMED_NON_MATCH' | 'INSUFFICIENT_EVIDENCE';

export interface WatchCriteriaInput {
  origin_code?: string | null;
  destination_code?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  return_date?: string | null;
  max_stops?: number | string | null;
  criteria_version?: number | string | null;
  cabin?: string | null;
  trip_type?: string | null;
  passengers?: number | string | null;
}

export function buildConditionFingerprint(params: {
  watchId: string;
  targetPrice: number;
  criteria?: WatchCriteriaInput | null;
}): string {
  if (!params.criteria) {
    return `cond_${params.watchId}_${params.targetPrice}`;
  }
  const origin = (params.criteria.origin_code ?? "").trim().toUpperCase();
  const dest = (params.criteria.destination_code ?? "").trim().toUpperCase();
  const dateFrom = (params.criteria.date_from ?? "").trim();
  const dateTo = (params.criteria.date_to ?? "").trim();
  const returnDate = (params.criteria.return_date ?? "").trim();
  const maxStops = params.criteria.max_stops == null ? "" : String(params.criteria.max_stops);
  const version = params.criteria.criteria_version == null ? "" : String(params.criteria.criteria_version);
  const cabin = (params.criteria.cabin ?? "").trim().toLowerCase();
  const tripType = (params.criteria.trip_type ?? "").trim().toLowerCase();
  const passengers = params.criteria.passengers == null ? "" : String(params.criteria.passengers);

  const extra = (cabin || tripType || passengers) ? `_${cabin}_${tripType}_${passengers}` : "";

  return `cond_${params.watchId}_${params.targetPrice}_${origin}_${dest}_${dateFrom}_${dateTo}_${returnDate}_${maxStops}_${version}${extra}`;
}

export function evaluateWatchCondition(params: {
  watchId: string;
  targetPrice: number;
  observedPrice?: number | null;
  conditionInput?: WatchConditionInput;
  activeEpisode: WatchConditionEpisode | null;
  generationId?: string | null;
  now?: string;
  criteria?: WatchCriteriaInput | null;
}): EpisodeEvaluationResult {
  const now = params.now || new Date().toISOString();
  let active = params.activeEpisode;
  const currentFingerprint = buildConditionFingerprint({
    watchId: params.watchId,
    targetPrice: params.targetPrice,
    criteria: params.criteria,
  });

  // RC-15: Criteria or target price mutation check
  // If an active episode exists with a different fingerprint, criteria was modified
  if (active && !active.closed_at && active.state !== 'EXITED' && active.condition_fingerprint) {
    if (active.condition_fingerprint !== currentFingerprint) {
      if (
        params.conditionInput === 'CONFIRMED_NON_MATCH' ||
        (params.observedPrice != null && Number.isFinite(params.observedPrice) && params.observedPrice > params.targetPrice)
      ) {
        return {
          nextEpisode: {
            ...active,
            closed_at: now,
            state: 'EXITED',
            last_event_at: now,
          },
          stateChanged: true,
          shouldAlert: false,
          transitionReason: `Criteria mutated (${active.condition_fingerprint} -> ${currentFingerprint}) and candidate does not match. Previous episode EXITED.`,
        };
      }
      // If eligible under new criteria, supersede old episode so a fresh episode enters
      active = null;
    }
  }

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
      transitionReason: 'INSUFFICIENT_EVIDENCE: Scope unmonitored or no observations. Episode state preserved intact.',
    };
  }

  const isEligible = params.conditionInput === 'MATCH' ||
    (params.conditionInput !== 'CONFIRMED_NON_MATCH' && (params.observedPrice as number) <= params.targetPrice);

  // Case 1: Price is confirmed above target price (CONFIRMED_NON_MATCH)
  if (!isEligible) {
    if (active && active.state !== 'EXITED' && !active.closed_at) {
      // NC-017 / NC-020: Price leaves target -> episode EXITED
      return {
        nextEpisode: {
          ...active,
          closed_at: now,
          state: 'EXITED',
          last_event_at: now,
        },
        stateChanged: true,
        shouldAlert: false,
        transitionReason: `Price increased above target (${params.observedPrice} > ${params.targetPrice}). Episode EXITED.`,
      };
    }
    return {
      nextEpisode: active,
      stateChanged: false,
      shouldAlert: false,
      transitionReason: 'Price remains above target. No active episode.',
    };
  }

  // Case 2: Price is within target price (eligible)
  // Sub-case 2a: No previous active episode, or previously closed/exited
  if (!active || active.state === 'EXITED' || active.closed_at) {
    const isReentry = !!(active && (active.state === 'EXITED' || active.closed_at));
    const newState: EpisodeState = isReentry ? 'REENTERED' : 'ENTERED';
    const newEpisode: WatchConditionEpisode = {
      id: `ep_${params.watchId}_${Date.now()}`,
      watch_id: params.watchId,
      condition_fingerprint: currentFingerprint,
      opened_at: now,
      closed_at: null,
      state: newState,
      entry_price: params.observedPrice,
      best_price: params.observedPrice,
      last_event_at: now,
      generation_id: params.generationId,
    };

    return {
      nextEpisode: newEpisode,
      stateChanged: true,
      shouldAlert: true,
      transitionReason: isReentry
        ? `NC-018 / NC-021: Price dropped back below target (${params.observedPrice} <= ${params.targetPrice}). REENTERED.`
        : `Price met target (${params.observedPrice} <= ${params.targetPrice}). ENTERED.`,
    };
  }

  // Sub-case 2b: Already inside active episode
  // Check for material improvement (NC-019 / NC-022: drop of at least 5% below previous best)
  const dropPercent = ((active.best_price - params.observedPrice) / active.best_price) * 100;
  if (dropPercent >= 5) {
    return {
      nextEpisode: {
        ...active,
        best_price: params.observedPrice,
        state: 'MATERIAL_IMPROVEMENT',
        last_event_at: now,
        generation_id: params.generationId,
      },
      stateChanged: true,
      shouldAlert: true,
      transitionReason: `NC-019 / NC-022: Material price drop of ${Math.round(dropPercent)}% to ${params.observedPrice}. MATERIAL_IMPROVEMENT.`,
    };
  }

  // Sub-case 2c: Still inside with minor or no improvement
  const updatedBest = Math.min(active.best_price, params.observedPrice);
  return {
    nextEpisode: {
      ...active,
      best_price: updatedBest,
      state: 'STILL_INSIDE',
      last_event_at: now,
      generation_id: params.generationId,
    },
    stateChanged: false,
    shouldAlert: false,
    transitionReason: `Price remains below target (${params.observedPrice} <= ${params.targetPrice}). STILL_INSIDE.`,
  };
}
