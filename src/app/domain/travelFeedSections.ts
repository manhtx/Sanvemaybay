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

const TS_CACHE = new Map<string, number>();

function observedTimestamp(deal: Deal): number {
  const at = deal.observedAt;
  if (!at) return 0;
  const cached = TS_CACHE.get(at);
  if (cached !== undefined) return cached;
  const value = Date.parse(at);
  const ts = Number.isFinite(value) ? value : 0;
  if (TS_CACHE.size >= 1000) TS_CACHE.clear();
  TS_CACHE.set(at, ts);
  return ts;
}

function getTop4(items: Deal[], isBetter: (a: Deal, b: Deal) => boolean): Deal[] {
  const top: Deal[] = [];
  const len = items.length;
  for (let i = 0; i < len; i++) {
    const item = items[i];
    if (top.length < 4) {
      let idx = top.length;
      while (idx > 0 && isBetter(item, top[idx - 1])) {
        idx--;
      }
      top.splice(idx, 0, item);
    } else if (isBetter(item, top[3])) {
      let idx = 3;
      while (idx > 0 && isBetter(item, top[idx - 1])) {
        idx--;
      }
      top.splice(idx, 0, item);
      top.pop();
    }
  }
  return top;
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

  if (deals.length <= 8) {
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

    const newlyDetected = [...deals]
      .sort((left, right) => observedTimestamp(right) - observedTimestamp(left))
      .slice(0, 4);

    const biggestDrops = [...deals]
      .sort((left, right) => right.discount - left.discount)
      .slice(0, 4);

    const recommendations = rankPersonalizedFeed(deals, preferences).slice(0, 4);

    return {
      hot: scoreSorted.slice(0, 4),
      newlyDetected,
      biggestDrops,
      recommendations,
      trendingDestinations: [...uniqueByDestination.values()],
    };
  }

  // High-volume O(N) top-4 extraction avoiding full multi-pass array sorts
  const hot = getTop4(deals, (a, b) => scoreOf(a) > scoreOf(b));
  const newlyDetected = getTop4(deals, (a, b) => observedTimestamp(a) > observedTimestamp(b));
  const biggestDrops = getTop4(deals, (a, b) => a.discount > b.discount);
  const recommendations = rankPersonalizedFeed(deals, preferences).slice(0, 4);

  const bestByDest = new Map<string, Deal>();
  for (let i = 0; i < deals.length; i++) {
    const d = deals[i];
    const key = d.toCode || d.to;
    const existing = bestByDest.get(key);
    if (!existing || scoreOf(d) > scoreOf(existing)) {
      bestByDest.set(key, d);
    }
  }
  const destDeals = Array.from(bestByDest.values());
  const trendingDestinations = destDeals.length <= 4
    ? destDeals.sort((a, b) => scoreOf(b) - scoreOf(a))
    : getTop4(destDeals, (a, b) => scoreOf(a) > scoreOf(b));

  return {
    hot,
    newlyDetected,
    biggestDrops,
    recommendations,
    trendingDestinations
  };
}
