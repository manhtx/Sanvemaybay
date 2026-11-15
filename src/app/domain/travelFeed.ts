import { Deal } from "../data/deals";
import { UserPreferences } from "../lib/preferences";

export function rankTravelFeed(deals: Deal[]): Deal[] {
  if (deals.length <= 1) return [...deals];
  const len = deals.length;
  const items = new Array(len);
  for (let i = 0; i < len; i++) {
    const deal = deals[i];
    const scoreVal = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
    const ts = deal.observedAt ? Date.parse(deal.observedAt) : 0;
    items[i] = {
      deal,
      score: Number.isFinite(scoreVal) ? scoreVal : 0,
      timestamp: Number.isFinite(ts) ? ts : 0,
    };
  }
  items.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);

  const diversified: Deal[] = [];
  const remaining: Deal[] = [];
  const seenDestinations = new Set<string>();
  for (let i = 0; i < items.length; i++) {
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
  if (deals.length <= 1) return [...deals];
  const baseRanked = rankTravelFeed(deals);
  const homeAirport = preferences.homeAirport;
  const favoriteRegions = preferences.favoriteRegions;
  const favoriteRegionsSet = favoriteRegions && favoriteRegions.length > 0 ? new Set(favoriteRegions) : null;
  const preferredAirlines = preferences.preferredAirlines;
  const preferredAirlinesSet = preferredAirlines && preferredAirlines.length > 0 ? new Set(preferredAirlines) : null;
  const maxStops = preferences.maxStops;
  const budget = preferences.budget;
  const maxFlightTimeMinutes = preferences.maxFlightTimeMinutes;

  const n = baseRanked.length;
  const items = new Array(n);
  for (let index = 0; index < n; index++) {
    const deal = baseRanked[index];
    let value = Number(deal.dealScore ?? deal.aiInsight?.savingScore);
    if (!Number.isFinite(value)) value = 0;
    if (deal.fromCode === homeAirport) value += 8;
    if (favoriteRegionsSet && favoriteRegionsSet.has(deal.region as any)) value += 12;
    if (preferredAirlinesSet && preferredAirlinesSet.has(deal.airlineCode)) value += 10;
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
