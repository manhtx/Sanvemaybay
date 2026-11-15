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
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function cleanStringArray(arr: unknown, fallback: string[]): string[] {
  if (!Array.isArray(arr)) return fallback;
  const len = arr.length;
  if (len === 0) return fallback;
  let allStrings = true;
  for (let i = 0; i < len; i++) {
    if (typeof arr[i] !== "string") {
      allStrings = false;
      break;
    }
  }
  if (allStrings) return arr.slice();
  return arr.filter((x): x is string => typeof x === "string");
}

export function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") return { ...defaultPreferences };
  const input = value as Partial<UserPreferences>;

  const rawHome = input.homeAirport;
  let homeAirport = defaultPreferences.homeAirport;
  if (typeof rawHome === "string") {
    const trimmed = rawHome.trim();
    if (trimmed) homeAirport = trimmed.toUpperCase();
  }

  const rawBudget = input.budget;
  const budget = typeof rawBudget === "number" && Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : defaultPreferences.budget;

  const rawStops = input.maxStops;
  const maxStops = typeof rawStops === "number" && Number.isInteger(rawStops) && rawStops >= 0 ? rawStops : defaultPreferences.maxStops;

  const rawCabin = input.cabinClass;
  const cabinClass = typeof rawCabin === "string" && cabins.has(rawCabin as UserPreferences["cabinClass"]) ? (rawCabin as UserPreferences["cabinClass"]) : defaultPreferences.cabinClass;

  const rawFlightTime = input.maxFlightTimeMinutes;
  const maxFlightTimeMinutes = typeof rawFlightTime === "number" && rawFlightTime > 0 ? rawFlightTime : undefined;

  const rawDepFrom = input.departureFrom;
  const rawDepTo = input.departureTo;
  let departureFrom: string | undefined;
  let departureTo: string | undefined;
  if (rawDepFrom !== undefined || rawDepTo !== undefined) {
    departureFrom = typeof rawDepFrom === "string" && DATE_REGEX.test(rawDepFrom) ? rawDepFrom : undefined;
    departureTo = typeof rawDepTo === "string" && DATE_REGEX.test(rawDepTo) ? rawDepTo : undefined;
    if (departureFrom && departureTo && departureFrom > departureTo) {
      departureFrom = undefined;
      departureTo = undefined;
    }
  }

  return {
    homeAirport,
    budget,
    favoriteRegions: cleanStringArray(input.favoriteRegions, defaultPreferences.favoriteRegions),
    maxStops,
    preferredAirlines: cleanStringArray(input.preferredAirlines, defaultPreferences.preferredAirlines),
    cabinClass,
    maxFlightTimeMinutes,
    allowSelfTransfer: input.allowSelfTransfer === true,
    departureFrom,
    departureTo,
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
