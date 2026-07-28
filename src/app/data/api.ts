import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Deal } from "./deals";

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
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .gte("depart_date", new Date().toISOString().slice(0, 10))
    .gt("valid_until", new Date().toISOString())
    .order("deal_score", { ascending: false });

  if (error || !data?.length) {
    if (error) console.error("Deal service unavailable.", error);
    return [];
  }

  return data.map(mapDealRow);
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
    aiInsight: row.ai_insight,
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
}): Promise<Deal[]> {
  const all = await getDeals();
  
  return all.filter((d) => {
    if (params.budget && d.price > params.budget) return false;
    if (params.from && d.fromCode !== params.from) return false;
    return true;
  });
}
