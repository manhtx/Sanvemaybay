import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Deal } from "./deals";
import { reportClientIssue } from "../lib/clientDiagnostics";

export interface TrackedRoute {
  id: string;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  country: string;
  region: Deal["region"];
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
    reportClientIssue("tracked_routes_unavailable");
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
