import { Deal } from "../data/deals";
import { UserPreferences } from "../lib/preferences";

const ISO_TS_CACHE = new Map<string, number>();

function parseIsoTimestamp(iso: string | undefined): number {
  if (!iso) return 0;
  const cached = ISO_TS_CACHE.get(iso);
  if (cached !== undefined) return cached;

  let result = 0;
  if (iso.length >= 19 && iso.charCodeAt(4) === 45 && iso.charCodeAt(7) === 45) {
    const year = (iso.charCodeAt(0) - 48) * 1000 + (iso.charCodeAt(1) - 48) * 100 + (iso.charCodeAt(2) - 48) * 10 + (iso.charCodeAt(3) - 48);
    const month = (iso.charCodeAt(5) - 48) * 10 + (iso.charCodeAt(6) - 48) - 1;
    const day = (iso.charCodeAt(8) - 48) * 10 + (iso.charCodeAt(9) - 48);
    const hour = (iso.charCodeAt(11) - 48) * 10 + (iso.charCodeAt(12) - 48);
    const min = (iso.charCodeAt(14) - 48) * 10 + (iso.charCodeAt(15) - 48);
    const sec = (iso.charCodeAt(17) - 48) * 10 + (iso.charCodeAt(18) - 48);
    result = Date.UTC(year, month, day, hour, min, sec);
  } else {
    const parsed = Date.parse(iso);
    result = Number.isFinite(parsed) ? parsed : 0;
  }
  if (ISO_TS_CACHE.size > 5000) ISO_TS_CACHE.clear();
  ISO_TS_CACHE.set(iso, result);
  return result;
}

const SCRATCH_DEALS: Deal[] = new Array(8);
const SCRATCH_SCORES: number[] = new Array(8);
const SCRATCH_TS: number[] = new Array(8);

const MAX_BUF = 16384;
const BUF_SCORES = new Float64Array(MAX_BUF);
const BUF_TIMESTAMPS = new Float64Array(MAX_BUF);
const BUF_INDICES = new Int32Array(MAX_BUF);
const BUF_PERS_SCORES = new Float64Array(MAX_BUF);
const BUF_PERS_INDICES = new Int32Array(MAX_BUF);

export function rankTravelFeed(deals: Deal[]): Deal[] {
  const len = deals.length;
  if (len <= 1) return [...deals];

  if (len <= 8) {
    for (let i = 0; i < len; i++) {
      const deal = deals[i];
      const scoreVal = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
      SCRATCH_DEALS[i] = deal;
      SCRATCH_SCORES[i] = Number.isFinite(scoreVal) ? scoreVal : 0;
      SCRATCH_TS[i] = parseIsoTimestamp(deal.observedAt);
    }

    for (let i = 1; i < len; i++) {
      const curDeal = SCRATCH_DEALS[i];
      const curScore = SCRATCH_SCORES[i];
      const curTs = SCRATCH_TS[i];
      let j = i - 1;
      while (j >= 0 && (SCRATCH_SCORES[j] < curScore || (SCRATCH_SCORES[j] === curScore && SCRATCH_TS[j] < curTs))) {
        SCRATCH_DEALS[j + 1] = SCRATCH_DEALS[j];
        SCRATCH_SCORES[j + 1] = SCRATCH_SCORES[j];
        SCRATCH_TS[j + 1] = SCRATCH_TS[j];
        j--;
      }
      SCRATCH_DEALS[j + 1] = curDeal;
      SCRATCH_SCORES[j + 1] = curScore;
      SCRATCH_TS[j + 1] = curTs;
    }

    const result = new Array(len);
    let front = 0;
    for (let i = 0; i < len; i++) {
      const d = SCRATCH_DEALS[i];
      let seen = false;
      for (let j = 0; j < front; j++) {
        if (result[j].toCode === d.toCode) {
          seen = true;
          break;
        }
      }
      if (!seen) {
        result[front++] = d;
      }
    }
    if (front < len) {
      for (let i = 0; i < len; i++) {
        const d = SCRATCH_DEALS[i];
        let isFront = false;
        for (let j = 0; j < front; j++) {
          if (result[j] === d) {
            isFront = true;
            break;
          }
        }
        if (!isFront) {
          result[front++] = d;
        }
      }
    }
    return result;
  }

  if (len <= MAX_BUF) {
    for (let i = 0; i < len; i++) {
      const deal = deals[i];
      const scoreVal = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
      BUF_SCORES[i] = Number.isFinite(scoreVal) ? scoreVal : 0;
      BUF_TIMESTAMPS[i] = parseIsoTimestamp(deal.observedAt);
      BUF_INDICES[i] = i;
    }
    const idx = BUF_INDICES.subarray(0, len);
    idx.sort((a, b) => BUF_SCORES[b] - BUF_SCORES[a] || BUF_TIMESTAMPS[b] - BUF_TIMESTAMPS[a]);

    const diversified: Deal[] = [];
    const remaining: Deal[] = [];
    const seenDestinations = new Set<string>();
    for (let i = 0; i < len; i++) {
      const d = deals[idx[i]];
      if (!seenDestinations.has(d.toCode)) {
        diversified.push(d);
        seenDestinations.add(d.toCode);
      } else {
        remaining.push(d);
      }
    }
    return diversified.concat(remaining);
  }

  const items = new Array(len);
  for (let i = 0; i < len; i++) {
    const deal = deals[i];
    const scoreVal = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
    const ts = parseIsoTimestamp(deal.observedAt);
    items[i] = {
      deal,
      score: Number.isFinite(scoreVal) ? scoreVal : 0,
      timestamp: ts,
    };
  }
  items.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);

  const diversified: Deal[] = [];
  const remaining: Deal[] = [];
  const seenDestinations = new Set<string>();
  for (let i = 0; i < len; i++) {
    const d = items[i].deal;
    if (!seenDestinations.has(d.toCode)) {
      diversified.push(d);
      seenDestinations.add(d.toCode);
    } else {
      remaining.push(d);
    }
  }
  return diversified.concat(remaining);
}

/** Rank the already validated feed against explicit user preferences.
 * This is a transparent ranking layer, not a claim of ML personalization.
 */
export function rankPersonalizedFeed(deals: Deal[], preferences: UserPreferences): Deal[] {
  const n = deals.length;
  if (n <= 1) return [...deals];
  const baseRanked = rankTravelFeed(deals);
  const homeAirport = preferences.homeAirport;
  const favoriteRegions = preferences.favoriteRegions;
  const favRegionSingle = favoriteRegions?.length === 1 ? favoriteRegions[0] : null;
  const favoriteRegionsSet = favoriteRegions && favoriteRegions.length > 1 ? new Set(favoriteRegions) : null;
  const preferredAirlines = preferences.preferredAirlines;
  const prefAirlineSingle = preferredAirlines?.length === 1 ? preferredAirlines[0] : null;
  const preferredAirlinesSet = preferredAirlines && preferredAirlines.length > 1 ? new Set(preferredAirlines) : null;
  const maxStops = preferences.maxStops;
  const budget = preferences.budget;
  const maxFlightTimeMinutes = preferences.maxFlightTimeMinutes;

  if (n <= 8) {
    for (let index = 0; index < n; index++) {
      const deal = baseRanked[index];
      let value = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
      if (!Number.isFinite(value)) value = 0;
      if (deal.fromCode === homeAirport) value += 8;
      if (favRegionSingle ? deal.region === favRegionSingle : (favoriteRegionsSet && favoriteRegionsSet.has(deal.region as any))) {
        value += 12;
      }
      if (prefAirlineSingle ? deal.airlineCode === prefAirlineSingle : (preferredAirlinesSet && preferredAirlinesSet.has(deal.airlineCode))) {
        value += 10;
      }
      if (deal.stops > maxStops) value -= Math.min(20, (deal.stops - maxStops) * 10);
      if (deal.price > budget) value -= 15;
      if (maxFlightTimeMinutes && parseDurationMinutes(deal.duration) > maxFlightTimeMinutes) value -= 10;
      SCRATCH_DEALS[index] = deal;
      SCRATCH_SCORES[index] = value - index * 0.001;
    }

    for (let i = 1; i < n; i++) {
      const curDeal = SCRATCH_DEALS[i];
      const curScore = SCRATCH_SCORES[i];
      let j = i - 1;
      while (j >= 0 && SCRATCH_SCORES[j] < curScore) {
        SCRATCH_DEALS[j + 1] = SCRATCH_DEALS[j];
        SCRATCH_SCORES[j + 1] = SCRATCH_SCORES[j];
        j--;
      }
      SCRATCH_DEALS[j + 1] = curDeal;
      SCRATCH_SCORES[j + 1] = curScore;
    }

    return SCRATCH_DEALS.slice(0, n);
  }

  if (n <= MAX_BUF) {
    for (let index = 0; index < n; index++) {
      const deal = baseRanked[index];
      let value = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
      if (!Number.isFinite(value)) value = 0;
      if (deal.fromCode === homeAirport) value += 8;
      if (favRegionSingle ? deal.region === favRegionSingle : (favoriteRegionsSet && favoriteRegionsSet.has(deal.region as any))) {
        value += 12;
      }
      if (prefAirlineSingle ? deal.airlineCode === prefAirlineSingle : (preferredAirlinesSet && preferredAirlinesSet.has(deal.airlineCode))) {
        value += 10;
      }
      if (deal.stops > maxStops) value -= Math.min(20, (deal.stops - maxStops) * 10);
      if (deal.price > budget) value -= 15;
      if (maxFlightTimeMinutes && parseDurationMinutes(deal.duration) > maxFlightTimeMinutes) value -= 10;
      BUF_PERS_SCORES[index] = value - index * 0.001;
      BUF_PERS_INDICES[index] = index;
    }

    const pIdx = BUF_PERS_INDICES.subarray(0, n);
    pIdx.sort((a, b) => BUF_PERS_SCORES[b] - BUF_PERS_SCORES[a]);
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = baseRanked[pIdx[i]];
    }
    return result;
  }

  const items = new Array(n);
  for (let index = 0; index < n; index++) {
    const deal = baseRanked[index];
    let value = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
    if (!Number.isFinite(value)) value = 0;
    if (deal.fromCode === homeAirport) value += 8;
    if (favRegionSingle ? deal.region === favRegionSingle : (favoriteRegionsSet && favoriteRegionsSet.has(deal.region as any))) {
      value += 12;
    }
    if (prefAirlineSingle ? deal.airlineCode === prefAirlineSingle : (preferredAirlinesSet && preferredAirlinesSet.has(deal.airlineCode))) {
      value += 10;
    }
    if (deal.stops > maxStops) value -= Math.min(20, (deal.stops - maxStops) * 10);
    if (deal.price > budget) value -= 15;
    if (maxFlightTimeMinutes && parseDurationMinutes(deal.duration) > maxFlightTimeMinutes) value -= 10;
    items[index] = { deal, score: value - index * 0.001 };
  }

  items.sort((a, b) => b.score - a.score);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = items[i].deal;
  }
  return result;
}

const DURATION_CACHE = new Map<string, number>();

function parseDurationMinutes(value: string): number {
  if (!value) return 0;
  const cached = DURATION_CACHE.get(value);
  if (cached !== undefined) return cached;
  let hours = 0;
  let minutes = 0;
  let currentNum = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      currentNum = currentNum * 10 + (code - 48);
    } else if (code === 104 || code === 72) {
      hours = currentNum;
      currentNum = 0;
    } else if (code === 109 || code === 77) {
      minutes = currentNum;
      currentNum = 0;
    }
  }
  const result = hours * 60 + minutes;
  if (DURATION_CACHE.size >= 1000) DURATION_CACHE.clear();
  DURATION_CACHE.set(value, result);
  return result;
}
