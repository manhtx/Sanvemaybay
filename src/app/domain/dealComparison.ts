import type { Deal } from "../data/deals.ts";

export interface DealComparisonRow {
  id: string;
  route: string;
  ticketPrice: number;
  totalCost?: number;
  durationMinutes: number | undefined;
  durationText?: string;
  stops: number | null;
  refundPolicy: string | undefined;
  risk: Deal["aiInsight"]["risk"] | "unknown";
  airline?: string;
  flightNumber?: string;
  departDate?: string;
  freshnessText?: string;
  confidenceScore?: number;
  unverifiedFields?: string[];
  isDominated?: boolean;
}

function durationMinutes(duration?: string): number | undefined {
  if (!duration || typeof duration !== "string") return undefined;
  const hours = duration.match(/(\d+)\s*(?:h|giờ|tiếng|g)/i)?.[1];
  const minutes = duration.match(/(?:(?:h|giờ|tiếng|g)\s*(\d{1,2})|\b(\d+)\s*(?:m|phút|p))/i);
  const minVal = minutes?.[1] || minutes?.[2];
  if (!hours && !minVal) return undefined;
  return Number(hours ?? 0) * 60 + Number(minVal ?? 0);
}

export function compareDeals(deals: Deal[]): DealComparisonRow[] {
  const rows = deals.map((deal) => {
    const unverifiedFields: string[] = [];
    if (!deal.duration) unverifiedFields.push("Thời gian bay");
    if (deal.stops === null || deal.stops === undefined) unverifiedFields.push("Số điểm dừng");
    if (!deal.refundPolicy) unverifiedFields.push("Chính sách hoàn/đổi vé");
    const hasRealTotal = deal.realTotal !== undefined && deal.realTotal !== null;
    if (!hasRealTotal) {
      unverifiedFields.push("Tổng chi phí thực tế (chưa có dữ liệu phụ phí)");
    }

    return {
      id: deal.id,
      route: `${deal.fromCode} → ${deal.toCode}`,
      ticketPrice: deal.price,
      totalCost: hasRealTotal ? deal.realTotal : undefined,
      durationMinutes: durationMinutes(deal.duration),
      durationText: deal.duration,
      stops: deal.stops,
      refundPolicy: deal.refundPolicy,
      risk: deal.aiInsight?.risk ?? "unknown",
      airline: deal.airline,
      flightNumber: deal.flightNumber,
      departDate: deal.departDate,
      freshnessText: deal.expiresIn,
      confidenceScore: deal.confidence,
      unverifiedFields: unverifiedFields.length > 0 ? unverifiedFields : undefined,
    };
  });

  const dominatedSet = identifyDominatedOptions(rows);
  return rows.map((r) => ({
    ...r,
    isDominated: dominatedSet.has(r.id),
  }));
}

export interface SavedComparisonInput {
  opportunityId: string;
  fromCode: string;
  toCode: string;
  fromCity?: string;
  toCity?: string;
  departDate?: string;
  savedPrice: number;
  currentPrice?: number | null;
  airline?: string;
  stops?: number | null;
  freshnessText?: string;
  rawDeal?: Deal;
  snapshotData?: Record<string, any> | null;
}

export function compareSavedOpportunities(items: SavedComparisonInput[]): DealComparisonRow[] {
  const rows = items.map((item) => {
    if (item.rawDeal) {
      const row = compareDeals([item.rawDeal])[0];
      return {
        ...row,
        id: item.opportunityId,
      };
    }

    const unverifiedFields: string[] = [];
    const snap = item.snapshotData;
    const dur = snap?.duration;
    const durMin = durationMinutes(dur);
    const hasRealTotal = snap?.realTotal !== undefined && snap?.realTotal !== null;

    if (!dur) unverifiedFields.push("Thời gian bay");
    if (item.stops === null || item.stops === undefined) unverifiedFields.push("Số điểm dừng");
    unverifiedFields.push("Chính sách hoàn/đổi vé");
    if (!hasRealTotal) {
      unverifiedFields.push("Chi tiết phụ phí thực tế");
    }

    const price = item.currentPrice ?? item.savedPrice;

    return {
      id: item.opportunityId,
      route: `${item.fromCode} → ${item.toCode}`,
      ticketPrice: price,
      totalCost: hasRealTotal ? snap.realTotal : undefined,
      durationMinutes: durMin,
      durationText: dur,
      stops: item.stops ?? null,
      refundPolicy: undefined,
      risk: "unknown" as const,
      airline: item.airline,
      flightNumber: snap?.flightNumber,
      departDate: item.departDate,
      freshnessText: item.freshnessText,
      unverifiedFields,
    };
  });

  const dominatedSet = identifyDominatedOptions(rows);
  return rows.map((r) => ({
    ...r,
    isDominated: dominatedSet.has(r.id),
  }));
}

export interface CompatibilityResult {
  isCompatible: boolean;
  sameRoute: boolean;
  routeSummary: string;
  dateWarning?: string;
  notes: string[];
}

export function checkOpportunitiesCompatibility(rows: DealComparisonRow[]): CompatibilityResult {
  if (rows.length === 0) {
    return { isCompatible: true, sameRoute: true, routeSummary: "", notes: [] };
  }
  const routes = Array.from(new Set(rows.map((r) => r.route)));
  const sameRoute = routes.length === 1;
  const notes: string[] = [];

  if (!sameRoute) {
    notes.push(`Các phương án thuộc ${routes.length} chặng bay khác nhau (${routes.join(", ")}).`);
  }

  const dates = rows.map((r) => r.departDate).filter((d): d is string => Boolean(d));
  let dateWarning: string | undefined;
  if (dates.length >= 2) {
    const timestamps = dates.map((d) => new Date(d).getTime()).filter((t) => !isNaN(t));
    if (timestamps.length >= 2) {
      const minDate = Math.min(...timestamps);
      const maxDate = Math.max(...timestamps);
      const diffDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        dateWarning = `Khoảng cách ngày khởi hành chênh lệch ${diffDays} ngày.`;
        notes.push(dateWarning);
      }
    }
  }

  return {
    isCompatible: sameRoute && !dateWarning,
    sameRoute,
    routeSummary: routes.join(", "),
    dateWarning,
    notes,
  };
}

export function explainTradeoff(cheaper: DealComparisonRow, costlier: DealComparisonRow): string {
  // AUD-V34-07 & EV34-15: If cheaper has unknown totalCost but costlier has verified totalCost,
  // we cannot claim cheaper is genuinely cheaper because unverified mandatory fees may exceed the difference.
  if (cheaper.totalCost === undefined && costlier.totalCost !== undefined) {
    return "Chưa thể khẳng định phương án này rẻ hơn: thiếu dữ liệu phụ phí bắt buộc của phương án so sánh (chưa rõ tổng chi phí thực tế).";
  }

  const cheaperCost = cheaper.totalCost ?? cheaper.ticketPrice;
  const costlierCost = costlier.totalCost ?? costlier.ticketPrice;
  const priceDiff = costlierCost - cheaperCost;
  const isEstimated = cheaper.totalCost === undefined || costlier.totalCost === undefined;

  if (priceDiff <= 0) return "Hai phương án có tổng chi phí tương đương.";

  const stopsDiff = (cheaper.stops != null && costlier.stops != null) ? cheaper.stops - costlier.stops : 0;
  const timeDiffMinutes = (cheaper.durationMinutes ?? 0) - (costlier.durationMinutes ?? 0);

  const formatMoney = (n: number) => {
    if (n >= 1_000_000) {
      const tr = (n / 1_000_000).toFixed(1).replace(/\.0$/, "");
      return `${tr} triệu`;
    }
    return `${Math.round(n / 1000)}k`;
  };

  const parts: string[] = [];
  if (timeDiffMinutes >= 60) {
    const hours = Math.round(timeDiffMinutes / 60);
    parts.push(`mất thêm ${hours} giờ`);
  }
  if (stopsDiff > 0) {
    parts.push(`thêm ${stopsDiff} điểm dừng`);
  }

  const qualifier = isEstimated ? " (ước tính theo giá vé gốc)" : "";
  if (parts.length > 0) {
    return `Rẻ hơn khoảng ${formatMoney(priceDiff)}${qualifier} nhưng ${parts.join(" và ")}.`;
  }
  if (timeDiffMinutes <= -60) {
    return `Rẻ hơn khoảng ${formatMoney(priceDiff)}${qualifier} và bay nhanh hơn.`;
  }
  return `Rẻ hơn khoảng ${formatMoney(priceDiff)}${qualifier} với hành trình tương đương.`;
}

export function identifyDominatedOptions(rows: DealComparisonRow[]): Set<string> {
  const dominatedIds = new Set<string>();
  for (const a of rows) {
    for (const b of rows) {
      if (a.id === b.id) continue;
      // Invariant (AUD-06 & AUD-15): Pareto comparison strictly requires all compared
      // dimensions to be defined, positive, and finite on both options. Missing dimensions cannot be treated as Infinity.
      if (
        a.totalCost == null || b.totalCost == null ||
        !Number.isFinite(a.totalCost) || !Number.isFinite(b.totalCost) ||
        a.totalCost <= 0 || b.totalCost <= 0 ||
        a.durationMinutes == null || b.durationMinutes == null ||
        !Number.isFinite(a.durationMinutes) || !Number.isFinite(b.durationMinutes) ||
        a.durationMinutes <= 0 || b.durationMinutes <= 0 ||
        a.stops == null || b.stops == null ||
        a.stops < 0 || b.stops < 0
      ) {
        continue;
      }
      const costA = Math.round(a.totalCost);
      const costB = Math.round(b.totalCost);
      const noWorse = costA <= costB && a.durationMinutes <= b.durationMinutes && a.stops <= b.stops;
      const strictlyBetter = costA < costB || a.durationMinutes < b.durationMinutes || a.stops < b.stops;
      if (noWorse && strictlyBetter) {
        dominatedIds.add(b.id);
      }
    }
  }
  return dominatedIds;
}

/**
 * Evaluates whether a candidate deal is strictly dominated by a baseline deal
 * according to 3-dimensional Pareto criteria (price, duration, stops).
 */
export function isDealDominated(
  candidate: { id?: string; price: number; durationMinutes?: number; stops?: number | null },
  baseline: { id?: string; price: number; durationMinutes?: number; stops?: number | null }
): boolean {
  if (candidate.id && baseline.id && candidate.id === baseline.id) return false;
  const candPrice = Math.round(candidate.price);
  const basePrice = Math.round(baseline.price);
  if (!Number.isFinite(candPrice) || candPrice <= 0 || !Number.isFinite(basePrice) || basePrice <= 0) return false;
  if (candidate.durationMinutes == null || baseline.durationMinutes == null || candidate.durationMinutes <= 0 || baseline.durationMinutes <= 0) return false;
  if (candidate.stops == null || baseline.stops == null || candidate.stops < 0 || baseline.stops < 0) return false;

  const noWorse = basePrice <= candPrice &&
                  baseline.durationMinutes <= candidate.durationMinutes &&
                  baseline.stops <= candidate.stops;

  const strictlyBetter = basePrice < candPrice ||
                         baseline.durationMinutes < candidate.durationMinutes ||
                         baseline.stops < candidate.stops;

  return noWorse && strictlyBetter;
}

/**
 * Sorts comparison rows monotonically and deterministically:
 * 1. Primary: effective landed total cost (totalCost ?? ticketPrice) ascending.
 * 2. Secondary: flight duration in minutes (durationMinutes ?? 9999) ascending.
 * 3. Tertiary: deterministic tie-breaking by row ID.
 */
export function sortComparisonRowsMonotonically(rows: DealComparisonRow[]): DealComparisonRow[] {
  return [...rows].sort((a, b) => {
    const costA = a.totalCost ?? a.ticketPrice;
    const costB = b.totalCost ?? b.ticketPrice;
    if (costA !== costB) return costA - costB;

    const durA = a.durationMinutes ?? 9999;
    const durB = b.durationMinutes ?? 9999;
    if (durA !== durB) return durA - durB;

    return a.id.localeCompare(b.id);
  });
}


