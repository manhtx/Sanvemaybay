import { Deal } from "../data/deals";
import { rankPersonalizedFeed } from "./travelFeed";
import { UserPreferences } from "../lib/preferences";

export interface TravelFeedSections {
  hot: Deal[];
  newlyDetected: Deal[];
  biggestDrops: Deal[];
  recommendations: Deal[];
  trendingDestinations: Deal[];
}

function scoreOf(deal: Deal): number {
  return deal.dealScore ?? deal.aiInsight.savingScore;
}

function observedTimestamp(deal: Deal): number {
  const value = deal.observedAt ? Date.parse(deal.observedAt) : Number.NaN;
  return Number.isFinite(value) ? value : 0;
}

export function buildTravelFeedSections(deals: Deal[], preferences: UserPreferences): TravelFeedSections {
  const uniqueByDestination = new Map<string, Deal>();
  for (const deal of [...deals].sort((left, right) => scoreOf(right) - scoreOf(left))) {
    const key = deal.toCode || deal.to;
    if (!uniqueByDestination.has(key)) uniqueByDestination.set(key, deal);
  }
  return {
    hot: [...deals].sort((left, right) => scoreOf(right) - scoreOf(left)).slice(0, 4),
    newlyDetected: [...deals].sort((left, right) => observedTimestamp(right) - observedTimestamp(left)).slice(0, 4),
    biggestDrops: [...deals].sort((left, right) => right.discount - left.discount).slice(0, 4),
    recommendations: rankPersonalizedFeed(deals, preferences).slice(0, 4),
    trendingDestinations: [...uniqueByDestination.values()].slice(0, 4),
  };
}
