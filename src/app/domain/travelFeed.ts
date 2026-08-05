import { Deal } from "../data/deals";
import { UserPreferences } from "../lib/preferences";

export function rankTravelFeed(deals: Deal[]): Deal[] {
  const score = (deal: Deal) => {
    const value = Number(deal.dealScore ?? deal.aiInsight.savingScore);
    return Number.isFinite(value) ? value : 0;
  };
  const timestamp = (deal: Deal) => {
    const value = new Date(deal.observedAt ?? 0).getTime();
    return Number.isFinite(value) ? value : 0;
  };
  const ranked = [...deals].sort((a, b) =>
    score(b) - score(a) || timestamp(b) - timestamp(a),
  );
  const diversified: Deal[] = [];
  const seenDestinations = new Set<string>();
  for (const deal of ranked) {
    if (!seenDestinations.has(deal.toCode)) {
      diversified.push(deal);
      seenDestinations.add(deal.toCode);
    }
  }
  return diversified.concat(ranked.filter((deal) => !diversified.includes(deal)));
}

/** Rank the already validated feed against explicit user preferences.
 * This is a transparent ranking layer, not a claim of ML personalization.
 */
export function rankPersonalizedFeed(deals: Deal[], preferences: UserPreferences): Deal[] {
  const baseRanked = rankTravelFeed(deals);
  const score = (deal: Deal, index: number) => {
    let value = Number(deal.dealScore ?? deal.aiInsight.savingScore);
    if (!Number.isFinite(value)) value = 0;
    if (deal.fromCode === preferences.homeAirport) value += 8;
    if (preferences.favoriteRegions.includes(deal.region)) value += 12;
    if (preferences.preferredAirlines.length > 0 && preferences.preferredAirlines.includes(deal.airlineCode)) value += 10;
    if (deal.stops > preferences.maxStops) value -= Math.min(20, (deal.stops - preferences.maxStops) * 10);
    if (deal.price > preferences.budget) value -= 15;
    if (preferences.maxFlightTimeMinutes && parseDurationMinutes(deal.duration) > preferences.maxFlightTimeMinutes) value -= 10;
    return value - index * 0.001;
  };
  return baseRanked
    .map((deal, index) => ({ deal, index }))
    .sort((a, b) => score(b.deal, b.index) - score(a.deal, a.index))
    .map(({ deal }) => deal);
}

function parseDurationMinutes(value: string): number {
  const hours = value.match(/(\d+)\s*h/i)?.[1];
  const minutes = value.match(/(\d+)\s*m/i)?.[1];
  return (hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0);
}
