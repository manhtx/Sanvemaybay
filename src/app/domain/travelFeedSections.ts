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
  if (!deals || deals.length === 0) {
    return {
      hot: [],
      newlyDetected: [],
      biggestDrops: [],
      recommendations: [],
      trendingDestinations: []
    };
  }

  // 1. Sort by score once and reuse for hot and trendingDestinations
  const scoreSorted = [...deals].sort((left, right) => scoreOf(right) - scoreOf(left));

  const uniqueByDestination = new Map<string, Deal>();
  for (let i = 0; i < scoreSorted.length; i++) {
    const deal = scoreSorted[i];
    const key = deal.toCode || deal.to;
    if (!uniqueByDestination.has(key)) {
      uniqueByDestination.set(key, deal);
      if (uniqueByDestination.size === 4) break;
    }
  }

  // 2. Newly detected: precompute timestamps once to avoid repeated Date.parse inside sort
  const withTimestamps = deals.map((d) => ({ deal: d, ts: observedTimestamp(d) }));
  withTimestamps.sort((left, right) => right.ts - left.ts);
  const newlyDetected = withTimestamps.slice(0, 4).map((x) => x.deal);

  // 3. Biggest drops
  const biggestDrops = [...deals].sort((left, right) => right.discount - left.discount).slice(0, 4);

  // 4. Recommendations
  const recommendations = rankPersonalizedFeed(deals, preferences).slice(0, 4);

  return {
    hot: scoreSorted.slice(0, 4),
    newlyDetected,
    biggestDrops,
    recommendations,
    trendingDestinations: [...uniqueByDestination.values()],
  };
}
