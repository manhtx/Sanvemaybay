import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Deal, normalizeAIInsight, PricePoint } from "./deals";
import { rankTravelFeed } from "../domain/travelFeed";
import { readFeedCache, writeFeedCache } from "../lib/feedCache";

export interface TrackedRoute {
  id: string;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  country: string;
  region: Deal["region"];
}

const bookingHosts = [
  "google.com",
  "skyscanner.net",
  "kayak.com",
  "vietnamairlines.com",
  "vietjetair.com",
  "bambooairways.com",
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
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  if (!isSupabaseConfigured) return readFeedCache(storage)?.deals ?? [];

  const { data: snapshot, error: snapshotError } = await supabase.functions.invoke("feed-snapshot", { body: {} });
  if (!snapshotError && Array.isArray(snapshot?.deals) && snapshot.deals.length > 0) {
    const rankedSnapshot = rankTravelFeed(snapshot.deals.map(mapDealRow));
    writeFeedCache(storage, rankedSnapshot);
    return rankedSnapshot;
  }

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .gte("depart_date", new Date().toISOString().slice(0, 10))
    .gt("valid_until", new Date().toISOString())
    .order("deal_score", { ascending: false });

  if (error || !data?.length) {
    if (error) console.error("Deal service unavailable.", error);
    return readFeedCache(storage)?.deals ?? [];
  }

  const ranked = rankTravelFeed(data.map(mapDealRow));
  writeFeedCache(storage, ranked);
  return ranked;
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
    
    return mapDealRow(data);
  } catch (err) {
    console.error(`Error fetching deal ${id}:`, err);
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
    console.error("Price history service unavailable.", error);
    return [];
  }
  return mapPriceHistoryRows(data ?? []);
}

export function mapPriceHistoryRows(rows: Array<{ date?: unknown; price?: unknown }>): PricePoint[] {
  return rows
    .map((row) => ({ date: String(row.date), price: Number(row.price) }))
    .filter((point) => point.date && Number.isFinite(point.price) && point.price > 0);
}

export async function getTrackedRoutes(): Promise<TrackedRoute[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("tracked_routes")
    .select("id, origin_code, origin_name, destination_code, destination_name, country, region")
    .eq("enabled", true)
    .order("origin_code")
    .order("destination_code");
  if (error) {
    console.error("Tracked route service unavailable.", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    originCode: row.origin_code,
    originName: row.origin_name,
    destinationCode: row.destination_code,
    destinationName: row.destination_name,
    country: row.country,
    region: row.region,
  }));
}

/**
 * Create a new user alert.
 * Tries: 1) Supabase Edge Function (if deployed), 2) Direct Resend API, 3) DB insert only
 */
export async function createAlert(alert: {
  destination: string;
  destination_code?: string;
  origin_code?: string;
  budget?: number;
  discount_threshold?: number;
  preferred_regions?: string[];
  date_from?: string;
  date_to?: string;
  frequency?: "instant" | "daily";
  notify_telegram: boolean;
  telegram_id?: string;
  notify_email: boolean;
  email: string;
  channel: string;
}) {
  if (!isSupabaseConfigured) {
    throw new Error("Dịch vụ cảnh báo chưa được cấu hình.");
  }

  const { data, error } = await supabase.functions.invoke("setup-alert", {
    body: {
      ...alert,
    },
  });

  if (error) {
    throw new Error(error.message || "Không thể kết nối dịch vụ cảnh báo.");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Cảnh báo chưa được lưu.");
  }

  return data;
}

export async function manageAlert(
  action: "confirm" | "unsubscribe",
  parameters: { token?: string; alert_id?: string; signature?: string },
) {
  if (!isSupabaseConfigured) throw new Error("Dịch vụ cảnh báo chưa được cấu hình.");
  const { data, error } = await supabase.functions.invoke("manage-alert", {
    body: { action, ...parameters },
  });
  if (error) throw new Error(error.message || "Không thể xử lý cảnh báo.");
  if (!data?.success) throw new Error(data?.error || "Không thể xử lý cảnh báo.");
  return data;
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
  return filterDeals(all, params);
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
