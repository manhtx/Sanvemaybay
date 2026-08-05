import { isSupabaseConfigured, supabase } from "./supabase";

export interface UserPreferences {
  homeAirport: string;
  budget: number;
  favoriteRegions: string[];
  maxStops: number;
  preferredAirlines: string[];
  cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  maxFlightTimeMinutes?: number;
  allowSelfTransfer: boolean;
  departureFrom?: string;
  departureTo?: string;
}

export const defaultPreferences: UserPreferences = {
  homeAirport: "HAN",
  budget: 15_000_000,
  favoriteRegions: ["asia"],
  maxStops: 1,
  preferredAirlines: [],
  cabinClass: "ECONOMY",
  allowSelfTransfer: false,
};

const STORAGE_KEY = "flycheap.user-preferences";
const cabins = new Set<UserPreferences["cabinClass"]>(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]);

export function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") return { ...defaultPreferences };
  const input = value as Partial<UserPreferences>;
  const validDate = (candidate: unknown): string | undefined =>
    typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
  const departureFrom = validDate(input.departureFrom);
  const departureTo = validDate(input.departureTo);
  return {
    homeAirport: typeof input.homeAirport === "string" && input.homeAirport.trim() ? input.homeAirport.toUpperCase() : defaultPreferences.homeAirport,
    budget: typeof input.budget === "number" && Number.isFinite(input.budget) && input.budget > 0 ? input.budget : defaultPreferences.budget,
    favoriteRegions: Array.isArray(input.favoriteRegions) ? input.favoriteRegions.filter((region): region is string => typeof region === "string") : defaultPreferences.favoriteRegions,
    maxStops: typeof input.maxStops === "number" && Number.isInteger(input.maxStops) && input.maxStops >= 0 ? input.maxStops : defaultPreferences.maxStops,
    preferredAirlines: Array.isArray(input.preferredAirlines) ? input.preferredAirlines.filter((airline): airline is string => typeof airline === "string") : defaultPreferences.preferredAirlines,
    cabinClass: typeof input.cabinClass === "string" && cabins.has(input.cabinClass as UserPreferences["cabinClass"]) ? input.cabinClass as UserPreferences["cabinClass"] : defaultPreferences.cabinClass,
    maxFlightTimeMinutes: typeof input.maxFlightTimeMinutes === "number" && input.maxFlightTimeMinutes > 0 ? input.maxFlightTimeMinutes : undefined,
    allowSelfTransfer: input.allowSelfTransfer === true,
    departureFrom: departureFrom && departureTo && departureFrom > departureTo ? undefined : departureFrom,
    departureTo: departureFrom && departureTo && departureFrom > departureTo ? undefined : departureTo,
  };
}

export function getUserPreferences(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): UserPreferences {
  if (!storage) return { ...defaultPreferences };
  try {
    return normalizePreferences(JSON.parse(storage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return { ...defaultPreferences };
  }
}

export function saveUserPreferences(preferences: Partial<UserPreferences>, storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): UserPreferences {
  const normalized = normalizePreferences({ ...getUserPreferences(storage), ...preferences });
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function loadRemoteUserPreferences(): Promise<UserPreferences | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
  if (error || !data) return undefined;
  return normalizePreferences({
    homeAirport: data.home_airport,
    budget: Number(data.budget_max),
    favoriteRegions: data.preferred_regions,
    maxStops: data.max_stops,
    preferredAirlines: data.preferred_airlines,
    cabinClass: data.cabin_class,
    maxFlightTimeMinutes: data.max_flight_time_minutes,
    allowSelfTransfer: data.allow_self_transfer,
    departureFrom: data.departure_from,
    departureTo: data.departure_to,
  });
}

export async function saveRemoteUserPreferences(preferences: UserPreferences): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    home_airport: preferences.homeAirport,
    budget_max: preferences.budget,
    preferred_regions: preferences.favoriteRegions,
    max_stops: preferences.maxStops,
    preferred_airlines: preferences.preferredAirlines,
    cabin_class: preferences.cabinClass,
    max_flight_time_minutes: preferences.maxFlightTimeMinutes ?? null,
    allow_self_transfer: preferences.allowSelfTransfer,
    departure_from: preferences.departureFrom ?? null,
    departure_to: preferences.departureTo ?? null,
  }, { onConflict: "user_id" });
  return !error;
}
