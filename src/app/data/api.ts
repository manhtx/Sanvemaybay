import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Deal, normalizeAIInsight, PricePoint } from "./deals";
import { rankTravelFeed } from "../domain/travelFeed";
import { readFeedCache, writeFeedCache, readObservedFaresCache, writeObservedFaresCache } from "../lib/feedCache";
import { evidenceGatedDealLabel } from "../domain/dealClaims";
import { reportClientIssue } from "../lib/clientDiagnostics";
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

export interface ObservedFarePage {
  fares: Deal[];
  total: number;
  nextPage: number | null;
  generatedAt?: string;
  latestObservedAt?: string;
  feedAgeMinutes?: number;
  retryable: boolean;
  status: "healthy" | "healthy_empty" | "degraded_freshness" | "stale_only" | "provider_unavailable";
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

  return {
    id: `observed-${row.id}`,
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

export async function getObservedFares(page = 1, pageSize = 60): Promise<ObservedFarePage> {
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  const cached = page === 1 ? readObservedFaresCache(storage) : undefined;

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
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );
    const invokePromise = supabase.functions.invoke("observed-fares", { body: { page, page_size: pageSize } });
    const { data, error } = (await Promise.race([invokePromise, timeoutPromise])) as any;

    if (error || !data || !Array.isArray(data.fares)) {
      const stale = page === 1 ? readObservedFaresCache(storage, Date.now(), true) : undefined;
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

    if (page === 1 && mappedFares.length > 0) {
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
    };
  } catch (_err) {
    const stale = page === 1 ? readObservedFaresCache(storage, Date.now(), true) : undefined;
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
  if (!isSupabaseConfigured) return undefined;

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .gte("depart_date", new Date().toISOString().slice(0, 10))
      .gt("valid_until", new Date().toISOString())
      .single();

    if (error) throw error;
    
    const deal = mapDealRow(data);
    return isActiveFeedDeal(deal) ? deal : undefined;
  } catch {
    reportClientIssue("deal_detail_unavailable");
    return undefined;
  }
}

export async function getPriceHistory(fromCode: string, toCode: string): Promise<PricePoint[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("price_history")
    .select("date, price")
    .eq("from_code", fromCode)
    .eq("to_code", toCode)
    .order("date", { ascending: true })
    .limit(180);
  if (error) {
    reportClientIssue("price_history_unavailable");
    return [];
  }
  return mapPriceHistoryRows(data ?? []);
}

export function mapPriceHistoryRows(rows: Array<{ date?: unknown; price?: unknown }>): PricePoint[] {
  return rows
    .map((row) => ({ date: String(row.date), price: Number(row.price) }))
    .filter((point) => point.date && Number.isFinite(point.price) && point.price > 0);
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
  const all = await getDeals();
  const live = await searchLiveDeals(params);
  return filterDeals([...live, ...all], params);
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
  const destination = params.destination?.trim().toLocaleLowerCase("vi");
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
    if (params.from && d.fromCode !== params.from) return false;
    if (destination && !`${d.to} ${d.toCode} ${d.country}`.toLocaleLowerCase("vi").includes(destination)) return false;
    if (params.maxStops != null && d.stops > params.maxStops) return false;
    if (fromDate && d.departDate < fromDate) return false;
    if (toDate && d.departDate > toDate) return false;
    const duration = maxFlightTime == null ? undefined : durationInMinutes(d.duration);
    if (maxFlightTime != null && duration != null && duration > maxFlightTime) return false;
    return true;
  });
}
