import { Deal } from "../data/deals";
import { UserPreferences } from "../lib/preferences";

export function rankTravelFeed(deals: Deal[]): Deal[] {
  if (deals.length <= 1) return [...deals];
  const items = deals.map((deal) => {
    const scoreVal = Number(deal.dealScore ?? deal.aiInsight.savingScore);
    const ts = deal.observedAt ? Date.parse(deal.observedAt) : 0;
    return {
      deal,
      score: Number.isFinite(scoreVal) ? scoreVal : 0,
      timestamp: Number.isFinite(ts) ? ts : 0,
    };
  });
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
  const favoriteRegions = new Set(preferences.favoriteRegions);
  const preferredAirlines = new Set(preferences.preferredAirlines);
  const hasPreferredAirlines = preferences.preferredAirlines.length > 0;
  const maxStops = preferences.maxStops;
  const budget = preferences.budget;
  const maxFlightTimeMinutes = preferences.maxFlightTimeMinutes;

  const items = baseRanked.map((deal, index) => {
    let value = Number(deal.dealScore ?? deal.aiInsight.savingScore);
    if (!Number.isFinite(value)) value = 0;
    if (deal.fromCode === homeAirport) value += 8;
    if (favoriteRegions.has(deal.region)) value += 12;
    if (hasPreferredAirlines && preferredAirlines.has(deal.airlineCode)) value += 10;
    if (deal.stops > maxStops) value -= Math.min(20, (deal.stops - maxStops) * 10);
    if (deal.price > budget) value -= 15;
    if (maxFlightTimeMinutes && parseDurationMinutes(deal.duration) > maxFlightTimeMinutes) value -= 10;
    return { deal, score: value - index * 0.001 };
  });

  items.sort((a, b) => b.score - a.score);
  return items.map((item) => item.deal);
}

function parseDurationMinutes(value: string): number {
  const hours = value.match(/(\d+)\s*h/i)?.[1];
  const minutes = value.match(/(\d+)\s*m/i)?.[1];
  return (hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0);
}
