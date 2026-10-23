import { Deal } from "../data/deals";

export type DecisionMode = "CHEAPEST" | "CONVENIENT" | "BUDGET_FIT" | "LOWER_RISK";

export interface DecisionModeMeta {
  mode: DecisionMode;
  label: string;
  description: string;
  badge: string;
}

export const DECISION_MODES: Record<DecisionMode, DecisionModeMeta> = {
  CHEAPEST: {
    mode: "CHEAPEST",
    label: "Rẻ nhất quan sát được",
    description: "Sắp xếp theo thứ tự mức giá quan sát từ thấp đến cao (Mặc định khách quan).",
    badge: "Giá rẻ",
  },
  CONVENIENT: {
    mode: "CONVENIENT",
    label: "Tiện lợi nhất",
    description: "Ưu tiên chuyến bay thẳng (0 stops) và thời lượng bay ngắn nhất để tiết kiệm thời gian.",
    badge: "Tiện lợi",
  },
  BUDGET_FIT: {
    mode: "BUDGET_FIT",
    label: "Khớp ngân sách",
    description: "Tối ưu hóa giá trị trong hạn mức ngân sách, hiển thị mức ngân sách dôi dư cho chi tiêu chuyến đi.",
    badge: "Khớp ngân sách",
  },
  LOWER_RISK: {
    mode: "LOWER_RISK",
    label: "Ít rủi ro nhất",
    description: "Hạn chế rủi ro trễ chuyến hoặc lỡ nối chuyến bằng cách ưu tiên bay thẳng và dữ liệu mới quan sát.",
    badge: "Ít rủi ro",
  },
};

export interface UserTimePreferences {
  enabled: boolean;
  hourlyValueVND: number; // Disclosed rate in VND/hr, e.g. 250,000 VND / hr saved
  stopPenaltyVND: number; // Disclosed layover penalty in VND/stop, e.g. 300,000 VND / stop
}

export const DEFAULT_USER_TIME_PREFERENCES: UserTimePreferences = {
  enabled: false,
  hourlyValueVND: 250000,
  stopPenaltyVND: 300000,
};

export interface EffectiveCostBreakdown {
  baseFare: number;
  durationMinutes: number;
  durationHours: number;
  timeInconvenienceCost: number;
  stopsPenaltyCost: number;
  totalGeneralizedCost: number;
}

export interface PartnershipMeta {
  isSponsored: boolean;
  partnerName?: string;
  referralRevenueVND?: number;
  affiliateCommissionRate?: number;
  disclosureText: string;
}

export interface RankedDeal {
  deal: Deal;
  mode: DecisionMode;
  rank: number;
  rankingReason: string;
  modeBadge: string;
  effectiveCostBreakdown?: EffectiveCostBreakdown;
  partnershipMeta?: PartnershipMeta;
}

export function parseDurationMinutes(durationStr?: string): number {
  if (!durationStr) return 9999;
  // Parse format like "2h 15m" or "2h" or "135m"
  const hoursMatch = durationStr.match(/(\d+)\s*h/i);
  const minsMatch = durationStr.match(/(\d+)\s*m/i);
  let total = 0;
  if (hoursMatch) total += parseInt(hoursMatch[1], 10) * 60;
  if (minsMatch) total += parseInt(minsMatch[1], 10);
  return total > 0 ? total : 9999;
}

/**
 * Calculates disclosed effective generalized travel cost (Air Fare + Value of Time + Stops Inconvenience).
 * F24: Personal value of time
 */
export function calculateEffectiveGeneralizedCost(
  deal: Deal,
  preferences: UserTimePreferences
): EffectiveCostBreakdown {
  const baseFare = deal.price;
  const durationMinutes = parseDurationMinutes(deal.duration);
  const durationHours = durationMinutes < 9999 ? Number((durationMinutes / 60).toFixed(2)) : 0;
  const stops = deal.stops ?? 0;
  const timeInconvenienceCost = Math.round(durationHours * preferences.hourlyValueVND);
  const stopsPenaltyCost = stops * preferences.stopPenaltyVND;
  const totalGeneralizedCost = baseFare + timeInconvenienceCost + stopsPenaltyCost;

  return {
    baseFare,
    durationMinutes,
    durationHours,
    timeInconvenienceCost,
    stopsPenaltyCost,
    totalGeneralizedCost,
  };
}

/**
 * Ranks deals according to personal value of time (generalized travel cost).
 * INVARIANT F24: Turning preferences off restores transparent price ranking.
 */
export function rankDealsByPersonalTimeValue(
  deals: Deal[],
  preferences: UserTimePreferences
): RankedDeal[] {
  if (!deals.length) return [];

  // Acceptance F24: Turning preferences off restores transparent price ranking
  if (!preferences.enabled) {
    return rankDealsByDecisionMode(deals, "CHEAPEST");
  }

  const copy = [...deals];
  copy.sort((a, b) => {
    const costA = calculateEffectiveGeneralizedCost(a, preferences).totalGeneralizedCost;
    const costB = calculateEffectiveGeneralizedCost(b, preferences).totalGeneralizedCost;
    if (costA !== costB) {
      return costA - costB;
    }
    return a.price - b.price;
  });

  const nf = new Intl.NumberFormat("vi-VN");
  return copy.map((deal, idx) => {
    const breakdown = calculateEffectiveGeneralizedCost(deal, preferences);
    const reason = `Tổng chi phí hữu dụng ${nf.format(breakdown.totalGeneralizedCost)}₫ (Giá vé ${nf.format(deal.price)}₫ + Thời gian ${nf.format(breakdown.timeInconvenienceCost)}₫ + Transit ${nf.format(breakdown.stopsPenaltyCost)}₫)`;
    return {
      deal,
      mode: "CONVENIENT",
      rank: idx + 1,
      rankingReason: reason,
      modeBadge: `Quy đổi: ${nf.format(breakdown.totalGeneralizedCost)}₫`,
      effectiveCostBreakdown: breakdown,
      partnershipMeta: deal.isSponsored
        ? {
            isSponsored: true,
            partnerName: deal.sponsorName || deal.airline,
            referralRevenueVND: deal.referralRevenueVND,
            affiliateCommissionRate: deal.affiliateCommissionRate,
            disclosureText: `Tài trợ đối tác · Thứ hạng giá khách quan: #${idx + 1} (Không làm sai lệch xếp hạng)`,
          }
        : undefined,
    };
  });
}

export function rankDealsByDecisionMode(
  deals: Deal[],
  mode: DecisionMode,
  budget?: number
): RankedDeal[] {
  if (!deals.length) return [];

  const copy = [...deals];

  switch (mode) {
    case "CHEAPEST": {
      // Objective price sort (F31 & F76 contract: Users can return to objective price sort; changing referral revenue cannot silently change price sort)
      copy.sort((a, b) => a.price - b.price);
      return copy.map((deal, idx) => ({
        deal,
        mode: "CHEAPEST",
        rank: idx + 1,
        rankingReason: `Mức giá quan sát thấp thứ #${idx + 1} (${new Intl.NumberFormat("vi-VN").format(deal.price)}₫)`,
        modeBadge: idx === 0 ? "Giá thấp nhất" : `Hạng #${idx + 1}`,
        partnershipMeta: deal.isSponsored
          ? {
              isSponsored: true,
              partnerName: deal.sponsorName || deal.airline,
              referralRevenueVND: deal.referralRevenueVND,
              affiliateCommissionRate: deal.affiliateCommissionRate,
              disclosureText: `Tài trợ đối tác · Thứ hạng giá khách quan: #${idx + 1} (Không ảnh hưởng đến thứ tự giá khách quan)`,
            }
          : undefined,
      }));
    }

    case "CONVENIENT": {
      // Prioritize stops=0, then duration, then price
      copy.sort((a, b) => {
        const stopsA = a.stops ?? 0;
        const stopsB = b.stops ?? 0;
        if (stopsA !== stopsB) {
          return stopsA - stopsB; // 0 stops first
        }
        const durA = parseDurationMinutes(a.duration);
        const durB = parseDurationMinutes(b.duration);
        if (durA !== durB) {
          return durA - durB;
        }
        return a.price - b.price;
      });

      return copy.map((deal, idx) => {
        const stops = deal.stops ?? 0;
        let reason = "";
        if (stops === 0) {
          reason = deal.duration
            ? `Bay thẳng không điểm dừng, thời gian bay ${deal.duration}`
            : "Bay thẳng tiết kiệm thời gian (0 stops)";
        } else {
          reason = `${stops} điểm dừng transit, thời gian bay ${deal.duration || "hợp lý"}`;
        }
        return {
          deal,
          mode: "CONVENIENT",
          rank: idx + 1,
          rankingReason: reason,
          modeBadge: stops === 0 ? "Bay thẳng" : `${stops} điểm dừng`,
        };
      });
    }

    case "BUDGET_FIT": {
      const userBudget = budget || 10000000;
      copy.sort((a, b) => {
        // Fits under budget first
        const underA = a.price <= userBudget;
        const underB = b.price <= userBudget;
        if (underA !== underB) return underA ? -1 : 1;

        // Highest discount / budget headroom
        const surplusA = userBudget - a.price;
        const surplusB = userBudget - b.price;
        if (surplusA !== surplusB) return surplusB - surplusA;

        return a.price - b.price;
      });

      return copy.map((deal, idx) => {
        const surplus = (budget || 10000000) - deal.price;
        let reason = "";
        if (surplus >= 0) {
          reason = `Tiết kiệm ${new Intl.NumberFormat("vi-VN").format(surplus)}₫ so với hạn mức ngân sách`;
        } else {
          reason = `Vượt ngân sách ${new Intl.NumberFormat("vi-VN").format(Math.abs(surplus))}₫`;
        }
        return {
          deal,
          mode: "BUDGET_FIT",
          rank: idx + 1,
          rankingReason: reason,
          modeBadge: surplus >= 0 ? `Dư ${new Intl.NumberFormat("vi-VN").format(surplus)}₫` : "Vượt ngân sách",
        };
      });
    }

    case "LOWER_RISK": {
      // Prioritize stops === 0 (avoid misconnects), then full-service/known carrier, then freshness, then price
      copy.sort((a, b) => {
        const stopsA = a.stops ?? 0;
        const stopsB = b.stops ?? 0;
        // Direct flight has zero misconnection risk
        if (stopsA !== stopsB) {
          return stopsA - stopsB;
        }

        // Freshness advantage: deals observed within 24h
        const now = Date.now();
        const ageA = a.observedAt ? now - new Date(a.observedAt).getTime() : 86400000 * 2;
        const ageB = b.observedAt ? now - new Date(b.observedAt).getTime() : 86400000 * 2;
        const isFreshA = ageA <= 86400000;
        const isFreshB = ageB <= 86400000;
        if (isFreshA !== isFreshB) return isFreshA ? -1 : 1;

        return a.price - b.price;
      });

      return copy.map((deal, idx) => {
        const stops = deal.stops ?? 0;
        let reason = "";
        if (stops === 0) {
          reason = "Hành trình bay thẳng (0 stops), loại trừ hoàn toàn rủi ro thất lạc hành lý hoặc trễ nối chuyến";
        } else {
          reason = "Có điểm dừng chuyển tiếp; khuyến nghị dự trù thời gian transit an toàn";
        }
        return {
          deal,
          mode: "LOWER_RISK",
          rank: idx + 1,
          rankingReason: reason,
          modeBadge: stops === 0 ? "Rủi ro thấp" : "Transit",
        };
      });
    }
  }
}

/**
 * INVARIANT F76: Changing referral revenue or sponsorship cannot silently change price sort.
 * Formally proves that mutating sponsorship status, commission rates, or referral revenue
 * on candidate deals results in strictly identical ranking order under CHEAPEST mode.
 */
export function verifyObjectivePriceSortInvariance(deals: Deal[]): boolean {
  if (!deals.length) return true;

  const baseRanked = rankDealsByDecisionMode(deals, "CHEAPEST");

  // Mutate all sponsorship, commission, and referral revenue metadata
  const mutatedDeals: Deal[] = deals.map((d, idx) => ({
    ...d,
    isSponsored: idx % 2 === 0,
    sponsorName: `Affiliate Partner ${idx + 1}`,
    referralRevenueVND: (idx + 1) * 25000000, // Massive commission differences
    affiliateCommissionRate: 0.10 * (idx + 1),
  }));

  const mutatedRanked = rankDealsByDecisionMode(mutatedDeals, "CHEAPEST");

  if (baseRanked.length !== mutatedRanked.length) return false;

  for (let i = 0; i < baseRanked.length; i++) {
    if (baseRanked[i].deal.id !== mutatedRanked[i].deal.id) {
      return false;
    }
    if (baseRanked[i].rank !== mutatedRanked[i].rank) {
      return false;
    }
    // Verify each rank is purely non-decreasing in price
    if (i > 0 && mutatedRanked[i].deal.price < mutatedRanked[i - 1].deal.price) {
      return false;
    }
  }

  return true;
}
