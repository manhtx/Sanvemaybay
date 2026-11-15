import { Deal } from "../data/deals";
import { UserPreferences } from "../lib/preferences";

function parseIsoTimestamp(iso: string | undefined): number {
  if (!iso) return 0;
  if (iso.length >= 19 && iso.charCodeAt(4) === 45 && iso.charCodeAt(7) === 45) {
    const year = (iso.charCodeAt(0) - 48) * 1000 + (iso.charCodeAt(1) - 48) * 100 + (iso.charCodeAt(2) - 48) * 10 + (iso.charCodeAt(3) - 48);
    const month = (iso.charCodeAt(5) - 48) * 10 + (iso.charCodeAt(6) - 48) - 1;
    const day = (iso.charCodeAt(8) - 48) * 10 + (iso.charCodeAt(9) - 48);
    const hour = (iso.charCodeAt(11) - 48) * 10 + (iso.charCodeAt(12) - 48);
    const min = (iso.charCodeAt(14) - 48) * 10 + (iso.charCodeAt(15) - 48);
    const sec = (iso.charCodeAt(17) - 48) * 10 + (iso.charCodeAt(18) - 48);
    return Date.UTC(year, month, day, hour, min, sec);
  }
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function rankTravelFeed(deals: Deal[]): Deal[] {
  const len = deals.length;
  if (len <= 1) return [...deals];
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
  if (len === 2) {
    const a = items[0];
    const b = items[1];
    if (b.score > a.score || (b.score === a.score && b.timestamp > a.timestamp)) {
      items[0] = b;
      items[1] = a;
    }
  } else if (len === 3) {
    if (items[1].score > items[0].score || (items[1].score === items[0].score && items[1].timestamp > items[0].timestamp)) {
      const t = items[0]; items[0] = items[1]; items[1] = t;
    }
    if (items[2].score > items[1].score || (items[2].score === items[1].score && items[2].timestamp > items[1].timestamp)) {
      const t = items[1]; items[1] = items[2]; items[2] = t;
      if (items[1].score > items[0].score || (items[1].score === items[0].score && items[1].timestamp > items[0].timestamp)) {
        const t2 = items[0]; items[0] = items[1]; items[1] = t2;
      }
    }
  } else {
    items.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
  }

  const result = new Array(len);
  let front = 0;
  if (len <= 8) {
    for (let i = 0; i < len; i++) {
      const d = items[i].deal;
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
        const d = items[i].deal;
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

  if (n === 2) {
    if (items[1].score > items[0].score) {
      return [items[1].deal, items[0].deal];
    }
    return [items[0].deal, items[1].deal];
  } else if (n === 3) {
    if (items[1].score > items[0].score) {
      const t = items[0]; items[0] = items[1]; items[1] = t;
    }
    if (items[2].score > items[1].score) {
      const t = items[1]; items[1] = items[2]; items[2] = t;
      if (items[1].score > items[0].score) {
        const t2 = items[0]; items[0] = items[1]; items[1] = t2;
      }
    }
    return [items[0].deal, items[1].deal, items[2].deal];
  }

  items.sort((a, b) => b.score - a.score);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = items[i].deal;
  }
  return result;
}

function parseDurationMinutes(value: string): number {
  if (!value) return 0;
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
  return hours * 60 + minutes;
}
