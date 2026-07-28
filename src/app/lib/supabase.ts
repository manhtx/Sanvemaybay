import { createClient } from "@supabase/supabase-js";

// types/supabase.ts will be generated via Supabase CLI
// For now, using 'any' or defining a subset of types
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const isSupabaseConfigured =
  Boolean((import.meta as any).env.VITE_SUPABASE_URL) &&
  Boolean((import.meta as any).env.VITE_SUPABASE_ANON_KEY) &&
  !supabaseUrl.includes("placeholder") &&
  !supabaseUrl.includes("your-project") &&
  !supabaseAnonKey.includes("placeholder") &&
  !supabaseAnonKey.includes("your-anon");

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing. Live deal data is unavailable.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
