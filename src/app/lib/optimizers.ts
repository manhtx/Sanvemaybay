import { supabase } from "./supabase";

export interface RouteLeg {
  origin: string;
  destination: string;
  price: number;
}

export interface OptimizedRoute {
  legs: RouteLeg[];
  totalPrice: number;
  savings: number;
  isMultiLeg: boolean;
}

const HUB_CITIES = ["ICN", "PVG", "TPE", "NRT"];

/**
 * Searches for multi-leg alternatives to a direct route.
 * Module 3.1: Multi-leg Routing
 */
export async function getOptimizedRoute(origin: string, destination: string, directPrice: number): Promise<OptimizedRoute> {
  // For v1 simulation (Real data context)
  // We search for flights from 'origin' to 'hub' and 'hub' to 'destination'
  
  try {
    const { data: legsToHubs } = await supabase
      .from("flights")
      .select("*")
      .eq("origin_code", origin)
      .in("destination_code", HUB_CITIES);

    const { data: legsFromHubs } = await supabase
      .from("flights")
      .select("*")
      .in("origin_code", HUB_CITIES)
      .eq("destination_code", destination);

    if (!legsToHubs || !legsFromHubs) return { legs: [], totalPrice: directPrice, savings: 0, isMultiLeg: false };

    let bestOption: OptimizedRoute = { legs: [], totalPrice: directPrice, savings: 0, isMultiLeg: false };

    for (const toHub of legsToHubs) {
      const fromHub = legsFromHubs.find(f => f.origin_code === toHub.destination_code);
      
      if (fromHub) {
        const total = Number(toHub.price) + Number(fromHub.price);
        if (total < bestOption.totalPrice) {
          bestOption = {
            legs: [
              { origin: toHub.origin_code, destination: toHub.destination_code, price: toHub.price },
              { origin: fromHub.origin_code, destination: fromHub.destination_code, price: fromHub.price }
            ],
            totalPrice: total,
            savings: directPrice - total,
            isMultiLeg: true
          };
        }
      }
    }

    return bestOption;
  } catch (err) {
    console.error("Optimization error:", err);
    return { legs: [], totalPrice: directPrice, savings: 0, isMultiLeg: false };
  }
}
