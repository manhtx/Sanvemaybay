import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Deal, normalizeAIInsight, PricePoint } from "./deals";
import { rankTravelFeed } from "../domain/travelFeed";
import { readFeedCache, writeFeedCache, readObservedFaresCache, writeObservedFaresCache } from "../lib/feedCache";
import { evidenceGatedDealLabel } from "../domain/dealClaims";
import { reportClientIssue } from "../lib/clientDiagnostics";
import { resolveCanonicalAirportOrCity } from "../domain/travelEntities";
export { createAlerts, manageAlert } from "./alertApi";
export type { CreateAlertInput } from "./alertApi";
export { getTrackedRoutes } from "./routeApi";
export type { TrackedRoute } from "./routeApi";

export type FeedStatus =
  | "healthy"
  | "healthy_empty"
  | "stale_only"
  | "degraded_schema"
  | "provider_unavailable";

export interface DealFeedResult {
  deals: Deal[];
  status: FeedStatus;
  source: string;
  generatedAt?: string;
  retryable: boolean;
  message: string;
}

export interface ObservedFareQuery {
  page?: number;
  pageSize?: number;
  origin?: string;
  destination?: string;
  region?: string;
  directOnly?: boolean;
  sort?: string;
  month?: string;
  budget?: number;
  maxStops?: number;
  departDateFrom?: string;
  departDateTo?: string;
  id?: string;
  opportunityId?: string;
  observationId?: string;
}

export interface ObservedFarePage {
  fares: Deal[];
  total: number;
  nextPage: number | null;
  generatedAt?: string;
  latestObservedAt?: string;
  feedAgeMinutes?: number;
  retryable: boolean;
  status: "healthy" | "healthy_empty" | "degraded_freshness" | "stale_only" | "provider_unavailable";
  regionCounts?: Record<string, number>;
}

const feedStatuses = new Set<FeedStatus>([
  "healthy",
  "healthy_empty",
  "stale_only",
  "degraded_schema",
  "provider_unavailable",
]);

export function parseFeedEnvelope(value: unknown): Omit<DealFeedResult, "deals"> & { rows: Record<string, any>[] } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const payload = value as Record<string, unknown>;
  if (!feedStatuses.has(payload.status as FeedStatus) || !Array.isArray(payload.deals)) return undefined;
  return {
    rows: payload.deals as Record<string, any>[],
    status: payload.status as FeedStatus,
    source: typeof payload.source === "string" ? payload.source : "unknown",
    generatedAt: typeof payload.generated_at === "string" ? payload.generated_at : undefined,
    retryable: payload.retryable === true,
    message: typeof payload.message === "string" ? payload.message : "Không thể xác định trạng thái nguồn deal.",
  };
}

async function parseFunctionErrorEnvelope(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== "object" || !("json" in context)) return undefined;
  try {
    return parseFeedEnvelope(await (context as { json: () => Promise<unknown> }).json());
  } catch {
    return undefined;
  }
}

const bookingHosts = [
  "google.com",
  "skyscanner.net",
  "kayak.com",
  "vietnamairlines.com",
  "vietjetair.com",
  "bambooairways.com",
  "aviasales.com",
  "travelpayouts.com",
];

export function sanitizeBookingUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;
    const hostname = url.hostname.toLowerCase();
    if (!bookingHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Deal fetching is server-backed. Provider credentials must never be shipped
 * to the browser.
 */
export async function getDeals(): Promise<Deal[]> {
  return (await getDealsResult()).deals;
}

export async function getDealsResult(): Promise<DealFeedResult> {
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  const cachedDeals = (readFeedCache(storage)?.deals ?? []).filter((deal) => isActiveFeedDeal(deal));
  if (!isSupabaseConfigured) {
    return {
      deals: cachedDeals,
      status: cachedDeals.length > 0 ? "stale_only" : "provider_unavailable",
      source: "local_cache",
      retryable: true,
      message: "Ứng dụng chưa được cấu hình kết nối nguồn deal.",
    };
  }

  const { data: snapshot, error: snapshotError } = await supabase.functions.invoke("feed-snapshot", { body: {} });
  const envelope = parseFeedEnvelope(snapshot) ?? await parseFunctionErrorEnvelope(snapshotError);
  if (envelope) {
    const rankedSnapshot = rankTravelFeed(envelope.rows.map(mapDealRow).filter((deal: Deal) => isActiveFeedDeal(deal)));
    if (rankedSnapshot.length > 0) writeFeedCache(storage, rankedSnapshot);
    return { ...envelope, deals: rankedSnapshot };
  }
  if (!snapshotError && Array.isArray(snapshot?.deals) && snapshot.deals.length > 0) {
    const rankedSnapshot = rankTravelFeed(snapshot.deals.map(mapDealRow).filter((deal: Deal) => isActiveFeedDeal(deal)));
    writeFeedCache(storage, rankedSnapshot);
    return {
      deals: rankedSnapshot,
      status: rankedSnapshot.length > 0 ? "healthy" : "stale_only",
      source: "legacy_snapshot",
      generatedAt: typeof snapshot.generated_at === "string" ? snapshot.generated_at : undefined,
      retryable: false,
      message: rankedSnapshot.length > 0 ? "Deal live đã được xác minh." : "Snapshot hiện không còn deal hợp lệ.",
    };
  }

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .gte("depart_date", new Date().toISOString().slice(0, 10))
    .gt("valid_until", new Date().toISOString())
    .order("deal_score", { ascending: false });

  if (error || !data?.length) {
    if (error) reportClientIssue("deal_service_unavailable");
    return {
      deals: cachedDeals,
      status: cachedDeals.length > 0 ? "stale_only" : "provider_unavailable",
      source: cachedDeals.length > 0 ? "local_cache" : "direct_query",
      retryable: true,
      message: cachedDeals.length > 0
        ? "Đang hiển thị dữ liệu dự phòng còn hiệu lực."
        : "Nguồn deal hiện tạm thời không khả dụng.",
    };
  }

  const ranked = rankTravelFeed(data.map(mapDealRow).filter((deal) => isActiveFeedDeal(deal)));
  if (ranked.length > 0) writeFeedCache(storage, ranked);
  return {
    deals: ranked,
    status: ranked.length > 0 ? "healthy" : "stale_only",
    source: "direct_query",
    retryable: false,
    message: ranked.length > 0 ? "Deal live đã được xác minh." : "Dữ liệu hiện có đã cũ hoặc chưa đủ điều kiện công bố.",
  };
}

export function mapObservedFare(row: Record<string, any>): Deal {
  const score = Math.max(0, Math.min(100, Number(row.deal_score) || 0));
  const sampleSize = Math.max(0, Number(row.sample_size) || 0);
  const confidencePercent = Math.max(0, Math.min(100, Number(row.confidence_percent) || Math.min(100, (sampleSize / 12) * 100)));
  const discount = row.discount_percent == null ? 0 : Math.max(0, Number(row.discount_percent));
  const baseline = row.baseline_price == null ? Number(row.price) : Number(row.baseline_price);
  const safeLabel = evidenceGatedDealLabel(score, confidencePercent);
  const isBudgetAirline = ["VJ", "AK", "FD", "TR", "5J", "SL"].includes(String(row.airline_code || "").toUpperCase());
  const estimatedBaggage = isBudgetAirline ? (row.region === "domestic" ? 280000 : 550000) : 0;
  const hiddenCosts = isBudgetAirline ? [{
    label: "Hành lý ký gửi 20kg (ước tính)",
    amount: estimatedBaggage,
    note: "Hãng bay giá rẻ thường chưa bao gồm kiện ký gửi tiêu chuẩn",
  }] : [];
  const basePrice = Number(row.price);
  const realTotal = basePrice + estimatedBaggage;
  const opportunityId = String(row.opportunity_id || [
    row.origin_code,
    row.destination_code,
    row.date || row.depart_date,
    row.return_date || "",
    row.airline_code,
    row.stops ?? 0,
  ].join(":"));

  return {
    id: `observed-${row.id}`,
    opportunityId,
    observationId: String(row.observation_id || row.id || "").replace(/^observed-/, ""),
    from: row.origin,
    fromCode: row.origin_code,
    to: row.destination,
    toCode: row.destination_code,
    country: row.country,
    region: row.region,
    price: basePrice,
    normalPrice: baseline,
    discount,
    currency: row.currency ?? "VND",
    airline: row.airline,
    airlineCode: row.airline_code,
    departDate: row.date,
    returnDate: row.return_date ?? undefined,
    duration: row.duration,
    stops: Number(row.stops),
    stopCity: null,
    seatsLeft: 0,
    expiresIn: row.freshness_minutes <= 60 ? "Quan sát trong 1 giờ" : `Quan sát ${Math.max(1, Math.round(Number(row.freshness_minutes) / 60))} giờ trước`,
    image: "",
    flightNumber: row.flight_number ?? "",
    aiInsight: {
      reason: row.discount_percent == null
        ? "Đang tích lũy thêm giá tương đương để tính mức chênh lệch."
        : `Thấp hơn mức giá thường gặp ${discount.toFixed(1)}% (từ ${sampleSize} quan sát so sánh).`,
      tags: [safeLabel, `Tin cậy ${confidencePercent < 50 ? "thấp" : confidencePercent < 75 ? "vừa" : "cao"}`, `${sampleSize} mẫu đối sánh`],
      risk: sampleSize >= 8 ? "low" : "medium",
      riskDetails: "Giá tham khảo từ nguồn; có thể thay đổi khi kiểm tra lại trực tiếp.",
      recommendation: "wait",
      recommendationNote: "Kiểm tra giá hiện tại trước khi quyết định.",
      savingScore: score,
    },
    hiddenCosts,
    advertisedTotal: basePrice,
    realTotal,
    isTrending: score >= 70 && confidencePercent >= 50,
    isFlashDeal: discount >= 30 && confidencePercent >= 65,
    tripType: row.region === "domestic" ? "domestic" : "international",
    confidence: confidencePercent / 100,
    dealScore: score,
    aiReasoning: safeLabel,
    bookingUrl: sanitizeBookingUrl(row.booking_url),
    linkKind: "indicative",
    observedAt: row.timestamp,
  };
}

export async function getObservedFares(pageOrQuery: number | ObservedFareQuery = 1, pageSize = 60): Promise<ObservedFarePage> {
  const queryObj: ObservedFareQuery = typeof pageOrQuery === "number"
    ? { page: pageOrQuery, pageSize }
    : { page: 1, pageSize: 60, ...pageOrQuery };
  const page = Math.max(1, queryObj.page ?? 1);
  const size = Math.max(1, queryObj.pageSize ?? pageSize);
  const isDefaultFeedQuery = page === 1 && !queryObj.origin && !queryObj.destination && (!queryObj.region || queryObj.region === "all") && (!queryObj.sort || queryObj.sort === "discount") && !queryObj.id && queryObj.budget == null && !queryObj.month;

  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  const cached = isDefaultFeedQuery ? readObservedFaresCache(storage) : undefined;

  if (!isSupabaseConfigured) {
    if (cached && cached.fares.length > 0) {
      return {
        fares: cached.fares,
        total: cached.total,
        nextPage: null,
        retryable: true,
        status: "degraded_freshness",
        latestObservedAt: cached.latestObservedAt,
        feedAgeMinutes: cached.feedAgeMinutes,
      };
    }
    return { fares: [], total: 0, nextPage: null, retryable: true, status: "provider_unavailable" };
  }

  try {
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 8000)
    );
    const body: Record<string, unknown> = { page, page_size: size };
    if (queryObj.origin) body.origin = queryObj.origin;
    if (queryObj.destination) body.destination = queryObj.destination;
    if (queryObj.region && queryObj.region !== "all") body.region = queryObj.region;
    if (queryObj.directOnly === true) body.direct_only = true;
    if (queryObj.sort) body.sort = queryObj.sort;
    if (queryObj.month && queryObj.month !== "all") body.month = queryObj.month;
    if (queryObj.budget != null) body.budget = queryObj.budget;
    if (queryObj.maxStops != null) body.max_stops = queryObj.maxStops;
    if (queryObj.departDateFrom) body.depart_date_from = queryObj.departDateFrom;
    if (queryObj.departDateTo) body.depart_date_to = queryObj.departDateTo;
    if (queryObj.id) body.id = queryObj.id;
    if (queryObj.opportunityId) body.opportunity_id = queryObj.opportunityId;
    if (queryObj.observationId) body.observation_id = queryObj.observationId;

    const invokePromise = supabase.functions.invoke("observed-fares", { body });
    const { data, error } = (await Promise.race([invokePromise, timeoutPromise])) as any;

    if (error || !data || !Array.isArray(data.fares)) {
      const stale = isDefaultFeedQuery ? readObservedFaresCache(storage, Date.now(), true) : undefined;
      if (stale && stale.fares.length > 0) {
        return {
          fares: stale.fares,
          total: stale.total,
          nextPage: null,
          retryable: true,
          status: "degraded_freshness",
          latestObservedAt: stale.latestObservedAt,
          feedAgeMinutes: stale.feedAgeMinutes,
        };
      }
      return { fares: [], total: 0, nextPage: null, retryable: true, status: "provider_unavailable" };
    }

    const acceptedStatuses: ObservedFarePage["status"][] = ["healthy", "healthy_empty", "degraded_freshness", "stale_only", "provider_unavailable"];
    const status: ObservedFarePage["status"] = acceptedStatuses.includes(data.status as ObservedFarePage["status"])
      ? data.status as ObservedFarePage["status"]
      : "provider_unavailable";

    const mappedFares = data.fares.map(mapObservedFare);
    const total = Math.max(0, Number(data.total) || 0);

    if (isDefaultFeedQuery && mappedFares.length > 0) {
      writeObservedFaresCache(storage, {
        fares: mappedFares,
        total,
        status,
        latestObservedAt: typeof data.latest_observed_at === "string" ? data.latest_observed_at : undefined,
        feedAgeMinutes: Number.isFinite(Number(data.feed_age_minutes)) ? Math.max(0, Number(data.feed_age_minutes)) : undefined,
      });
    }

    return {
      fares: mappedFares,
      total,
      nextPage: Number.isInteger(data.next_page) ? data.next_page : null,
      generatedAt: typeof data.generated_at === "string" ? data.generated_at : undefined,
      latestObservedAt: typeof data.latest_observed_at === "string" ? data.latest_observed_at : undefined,
      feedAgeMinutes: Number.isFinite(Number(data.feed_age_minutes)) ? Math.max(0, Number(data.feed_age_minutes)) : undefined,
      retryable: data.retryable === true,
      status,
      regionCounts: data.region_counts && typeof data.region_counts === "object" ? data.region_counts : undefined,
    };
  } catch {
    const stale = isDefaultFeedQuery ? readObservedFaresCache(storage, Date.now(), true) : undefined;
    if (stale && stale.fares.length > 0) {
      return {
        fares: stale.fares,
        total: stale.total,
        nextPage: null,
        retryable: true,
        status: "degraded_freshness",
        latestObservedAt: stale.latestObservedAt,
        feedAgeMinutes: stale.feedAgeMinutes,
      };
    }
    return { fares: [], total: 0, nextPage: null, retryable: true, status: "provider_unavailable" };
  }
}

export async function getHistoricalDeals(): Promise<Deal[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("deal_snapshots")
    .select("id,payload,observed_at,valid_until")
    .order("observed_at", { ascending: false })
    .limit(500);
  if (error || !data) return [];
  return data.flatMap((snapshot) => {
    const payload = snapshot.payload && typeof snapshot.payload === "object" ? snapshot.payload as Record<string, unknown> : null;
    if (!payload) return [];
    return [mapDealRow({ ...payload, id: snapshot.id, observed_at: snapshot.observed_at, valid_until: snapshot.valid_until })];
  });
}

export function mapDealRow(row: Record<string, any>): Deal {
  return {
    id: row.id,
    from: row.from,
    fromCode: row.from_code,
    to: row.to,
    toCode: row.to_code,
    country: row.country,
    region: row.region,
    price: Number(row.price),
    normalPrice: Number(row.normal_price),
    discount: Number(row.discount),
    currency: row.currency,
    airline: row.airline,
    airlineCode: row.airline_code,
    departDate: row.depart_date,
    returnDate: row.return_date ?? undefined,
    duration: row.duration,
    stops: Number(row.stops),
    stopCity: row.stop_city,
    seatsLeft: Number(row.seats_left),
    expiresIn: row.expires_in,
    image: row.image,
    flightNumber: row.flight_number ?? "",
    aiInsight: normalizeAIInsight(row.ai_insight),
    hiddenCosts: row.hidden_costs,
    advertisedTotal: Number(row.advertised_total),
    realTotal: Number(row.real_total),
    isTrending: row.is_trending,
    isFlashDeal: row.is_flash_deal,
    tripType: row.trip_type,
    confidence: row.confidence == null ? undefined : Number(row.confidence),
    dealScore: row.deal_score == null ? undefined : Number(row.deal_score),
    aiReasoning: row.ai_reasoning ?? undefined,
    bookingUrl: sanitizeBookingUrl(row.booking_url),
    affiliateUrl: sanitizeBookingUrl(row.affiliate_url),
    affiliateNetwork: typeof row.affiliate_network === "string" ? row.affiliate_network : undefined,
    linkKind: ["live_affiliate", "live_source", "indicative", "historical", "stale"].includes(row.link_kind)
      ? row.link_kind
      : undefined,
    refundPolicy: typeof row.refund_policy === "string" && row.refund_policy.trim() ? row.refund_policy : undefined,
    observedAt: row.observed_at ?? undefined,
    validUntil: row.valid_until ?? undefined,
  };
}

export function isActiveFeedDeal(deal: Deal, now = new Date()): boolean {
  if (deal.linkKind !== "live_source" && deal.linkKind !== "live_affiliate") return false;
  const departDate = new Date(`${deal.departDate}T00:00:00Z`);
  const validUntil = deal.validUntil ? new Date(deal.validUntil) : undefined;
  if (!(departDate > now) || !validUntil || !(validUntil > now)) return false;
  if (!(deal.price > 0) || !deal.duration.trim()) return false;
  if (deal.linkKind === "live_affiliate") {
    return Boolean(deal.affiliateNetwork && deal.affiliateUrl);
  }
  return Boolean(deal.bookingUrl);
}

/**
 * Fetch a single deal by ID.
 */
export async function getDealById(id: string): Promise<Deal | undefined> {
  const cleanId = id.trim();
  const rawId = cleanId.replace(/^observed-/, "");
  const storage = typeof window === "undefined" ? undefined : window.localStorage;

  // 1. Check local cache first for instant zero-latency loading
  const cachedObserved = readObservedFaresCache(storage)?.fares ?? [];
  const foundObserved = cachedObserved.find(
    (d) =>
      d.id === cleanId ||
      d.id === `observed-${cleanId}` ||
      d.id === rawId ||
      d.id === `observed-${rawId}` ||
      d.opportunityId === cleanId ||
      d.opportunityId === rawId ||
      d.observationId === rawId ||
      (d as any).dedupe_key === rawId
  );
  if (foundObserved) return foundObserved;

  const cachedDeals = readFeedCache(storage)?.deals ?? [];
  const foundFeed = cachedDeals.find((d) => d.id === cleanId || d.opportunityId === cleanId);
  if (foundFeed && isActiveFeedDeal(foundFeed)) return foundFeed;

  if (!isSupabaseConfigured) return undefined;

  // 2. Query observed-fares if it is an observed fare ID, UUID, dedupe_key, or opportunity_id
  const isObservedCandidate =
    cleanId.startsWith("observed-") ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId) ||
    cleanId.includes(":");
  if (isObservedCandidate) {
    try {
      const page = await getObservedFares({ id: rawId, pageSize: 60 });
      const matching = page.fares.find(
        (f) =>
          f.id === cleanId ||
          f.id === `observed-${rawId}` ||
          f.id === rawId ||
          f.opportunityId === cleanId ||
          f.opportunityId === rawId ||
          f.observationId === rawId ||
          (f as any).dedupe_key === rawId
      );
      if (matching) return matching;
      if (page.fares.length > 0 && page.total === 1) return page.fares[0];
    } catch {
      // Fall through to database queries
    }
  }

  // 3. Try deals table
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', cleanId)
      .gte("depart_date", new Date().toISOString().slice(0, 10))
      .gt("valid_until", new Date().toISOString())
      .single();

    if (!error && data) {
      const deal = mapDealRow(data);
      if (isActiveFeedDeal(deal)) return deal;
    }
  } catch {
    // Continue
  }

  // 4. Fallback: check initial observed fares batch
  try {
    const fallbackPage = await getObservedFares(1, 120);
    const foundFallback = fallbackPage.fares.find(
      (f) =>
        f.id === cleanId ||
        f.id === `observed-${rawId}` ||
        f.id === rawId ||
        f.opportunityId === cleanId ||
        f.opportunityId === rawId ||
        f.observationId === rawId ||
        (f as any).dedupe_key === rawId
    );
    if (foundFallback) return foundFallback;
  } catch {
    // Continue
  }

  reportClientIssue("deal_detail_unavailable");
  return undefined;
}

export async function getPriceHistory(fromCode: string, toCode: string): Promise<PricePoint[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("price_history")
      .select("date, price")
      .eq("from_code", fromCode)
      .eq("to_code", toCode)
      .order("date", { ascending: true })
      .limit(180);
    if (!error && data && data.length > 0) {
      const mapped = mapPriceHistoryRows(data);
      if (mapped.length > 0) return mapped;
    }
  } catch {
    reportClientIssue("price_history_unavailable");
  }

  // Resilient fallback: derive historical price points from observed fares for this route
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  const cachedFares = (readObservedFaresCache(storage)?.fares ?? []).filter(
    (f) => f.fromCode === fromCode && f.toCode === toCode
  );
  if (cachedFares.length > 0) {
    const pointsMap = new Map<string, number>();
    for (const f of cachedFares) {
      const dateKey = f.observedAt ? f.observedAt.slice(0, 10) : f.departDate;
      if (!pointsMap.has(dateKey) || f.price < pointsMap.get(dateKey)!) {
        pointsMap.set(dateKey, f.price);
      }
    }
    const points: PricePoint[] = Array.from(pointsMap.entries()).map(([date, price]) => ({ date, price }));
    return points.sort((a, b) => a.date.localeCompare(b.date));
  }

  return [];
}

export function mapPriceHistoryRows(rows: Array<{ date?: unknown; price?: unknown }>): PricePoint[] {
  return rows
    .map((row) => ({ date: String(row.date), price: Number(row.price) }))
    .filter((point) => point.date && Number.isFinite(point.price) && point.price > 0);
}

export type SearchStatus = "healthy" | "healthy_empty" | "degraded" | "provider_unavailable";

export interface SearchDealsResult {
  deals: Deal[];
  status: SearchStatus;
  retryable: boolean;
}

export async function searchDealsWithStatus(params: {
  budget?: number;
  from?: string;
  destination?: string;
  maxStops?: number;
  departureFrom?: string;
  departureTo?: string;
  maxFlightTimeMinutes?: number;
}): Promise<SearchDealsResult> {
  const canonicalDest = resolveCanonicalAirportOrCity(params.destination);
  const destinationCode = canonicalDest?.code || (params.destination && /^[A-Z]{3}$/i.test(params.destination.trim())
    ? params.destination.trim().toUpperCase()
    : undefined);
  const canonicalFrom = resolveCanonicalAirportOrCity(params.from);
  const fromCode = canonicalFrom?.code || params.from;

  let observedFailed = false;
  let feedFailed = false;
  let liveFailed = false;

  const [observedResult, allFeedDeals, liveDeals] = await Promise.all([
    getObservedFares({
      origin: fromCode,
      destination: destinationCode,
      budget: params.budget,
      maxStops: params.maxStops,
      departDateFrom: params.departureFrom,
      departDateTo: params.departureTo,
      pageSize: 120,
    }).catch(() => {
      observedFailed = true;
      return { fares: [] as Deal[], total: 0, nextPage: null, retryable: true, status: "provider_unavailable" as const };
    }),
    getDeals().catch(() => {
      feedFailed = true;
      return [] as Deal[];
    }),
    searchLiveDeals({ ...params, from: fromCode, destination: destinationCode || params.destination }).catch(() => {
      liveFailed = true;
      return [] as Deal[];
    }),
  ]);

  if (observedResult.status === "provider_unavailable" || observedResult.status === "stale_only") {
    observedFailed = true;
  }

  const candidatePool = [...liveDeals, ...observedResult.fares, ...allFeedDeals];
  const seenIds = new Set<string>();
  const uniquePool: Deal[] = [];
  for (const deal of candidatePool) {
    if (!seenIds.has(deal.id)) {
      seenIds.add(deal.id);
      uniquePool.push(deal);
    }
  }

  const filtered = filterDeals(uniquePool, params);

  let status: SearchStatus = "healthy";
  if (filtered.length === 0) {
    if (observedFailed && (feedFailed || liveFailed)) {
      status = "provider_unavailable";
    } else if (observedFailed) {
      status = "degraded";
    } else {
      status = "healthy_empty";
    }
  } else if (observedFailed || feedFailed) {
    status = "degraded";
  }

  return {
    deals: filtered,
    status,
    retryable: status === "provider_unavailable" || status === "degraded",
  };
}

/** Filter observed deals only by fields returned by the data pipeline. */
export async function searchDeals(params: {
  budget?: number;
  from?: string;
  destination?: string;
  maxStops?: number;
  departureFrom?: string;
  departureTo?: string;
  maxFlightTimeMinutes?: number;
}): Promise<Deal[]> {
  const result = await searchDealsWithStatus(params);
  return result.deals;
}

async function searchLiveDeals(params: {
  from?: string;
  destination?: string;
  departureFrom?: string;
  departureTo?: string;
}): Promise<Deal[]> {
  const destination = params.destination?.trim().toUpperCase() ?? "";
  const from = params.from?.trim().toUpperCase() ?? "";
  if (!isSupabaseConfigured || !/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(destination) ||
    !params.departureFrom || !params.departureTo) return [];
  const { data, error } = await supabase.functions.invoke("flight-search", {
    body: {
      origin: from,
      destination,
      outbound_date: params.departureFrom,
      return_date: params.departureTo,
    },
  });
  if (error || !Array.isArray(data?.results)) return [];
  return data.results.flatMap((row: Record<string, unknown>, index: number) => {
    const price = Number(row.price);
    const departDate = typeof row.depart_date === "string" ? row.depart_date : "";
    const returnDate = typeof row.return_date === "string" ? row.return_date : undefined;
    if (!Number.isFinite(price) || price <= 0 || !departDate) return [];
    const linkKind = row.link_kind === "live_affiliate" ? "live_affiliate" : "indicative";
    const bookingUrl = sanitizeBookingUrl(row.booking_url);
    const affiliateUrl = sanitizeBookingUrl(row.affiliate_url);
    return [{
      id: `live-search-${from}-${destination}-${departDate}-${index}`,
      from: from,
      fromCode: from,
      to: destination,
      toCode: destination,
      country: "",
      region: "asia",
      price,
      normalPrice: price,
      discount: 0,
      currency: "VND",
      airline: typeof row.airline_code === "string" ? row.airline_code : "Provider live",
      airlineCode: typeof row.airline_code === "string" ? row.airline_code : "",
      departDate,
      returnDate,
      duration: "Chưa có dữ liệu",
      stops: Number(row.stops ?? 0),
      stopCity: null,
      seatsLeft: 0,
      expiresIn: "Kiểm tra lại trước khi đặt",
      image: "",
      flightNumber: "",
      aiInsight: {
        reason: linkKind === "live_affiliate" ? "Kết quả provider live có deeplink affiliate." : "Giá tham khảo từ provider live; cần kiểm tra lại trước khi đặt.",
        tags: [linkKind === "live_affiliate" ? "Affiliate" : "Indicative", "Tìm theo input"],
        risk: "medium",
        riskDetails: "Giá và chỗ trống có thể thay đổi khi mở trang nhà cung cấp.",
        recommendation: "wait",
        recommendationNote: "Kiểm tra giá trực tiếp trước khi quyết định.",
        savingScore: 0,
      },
      hiddenCosts: [],
      advertisedTotal: price,
      realTotal: price,
      isTrending: false,
      isFlashDeal: false,
      tripType: "international",
      bookingUrl,
      affiliateUrl,
      affiliateNetwork: linkKind === "live_affiliate" ? "travelpayouts" : undefined,
      linkKind,
      observedAt: typeof row.observed_at === "string" ? row.observed_at : undefined,
    } satisfies Deal];
  });
}

export function filterDeals(deals: Deal[], params: {
  budget?: number;
  from?: string;
  destination?: string;
  maxStops?: number;
  departureFrom?: string;
  departureTo?: string;
  maxFlightTimeMinutes?: number;
}): Deal[] {
  const fromDate = params.departureFrom && /^\d{4}-\d{2}-\d{2}$/.test(params.departureFrom) ? params.departureFrom : undefined;
  const toDate = params.departureTo && /^\d{4}-\d{2}-\d{2}$/.test(params.departureTo) ? params.departureTo : undefined;
  if (fromDate && toDate && fromDate > toDate) return [];
  const canonicalDest = resolveCanonicalAirportOrCity(params.destination);
  const destination = params.destination?.trim().toLocaleLowerCase("vi");
  const canonicalFrom = resolveCanonicalAirportOrCity(params.from);
  const maxFlightTime = params.maxFlightTimeMinutes && Number.isFinite(params.maxFlightTimeMinutes) && params.maxFlightTimeMinutes > 0
    ? params.maxFlightTimeMinutes
    : undefined;
  const durationInMinutes = (duration: string): number | undefined => {
    const hours = duration.match(/(\d+)\s*h/i)?.[1];
    const minutes = duration.match(/(\d+)\s*m/i)?.[1];
    if (!hours && !minutes) return undefined;
    return Number(hours ?? 0) * 60 + Number(minutes ?? 0);
  };
  return deals.filter((d) => {
    if (params.budget && d.price > params.budget) return false;
    if (params.from) {
      const allowedFrom = canonicalFrom?.servedAirports && canonicalFrom.servedAirports.length > 0
        ? canonicalFrom.servedAirports
        : [params.from, canonicalFrom?.code].filter(Boolean);
      if (!allowedFrom.includes(d.fromCode)) return false;
    }
    if (canonicalDest) {
      const allowedDest = canonicalDest.servedAirports && canonicalDest.servedAirports.length > 0
        ? canonicalDest.servedAirports
        : [canonicalDest.code];
      if (!allowedDest.includes(d.toCode)) return false;
    } else if (destination && !`${d.to} ${d.toCode} ${d.country}`.toLocaleLowerCase("vi").includes(destination)) {
      return false;
    }
    if (params.maxStops != null && d.stops > params.maxStops) return false;
    if (fromDate && d.departDate < fromDate) return false;
    if (toDate && d.departDate > toDate) return false;
    const duration = maxFlightTime == null ? undefined : durationInMinutes(d.duration);
    if (maxFlightTime != null && duration != null && duration > maxFlightTime) return false;
    return true;
  });
}
