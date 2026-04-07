import { createClient } from "@supabase/supabase-js";

// types/supabase.ts will be generated via Supabase CLI
// For now, using 'any' or defining a subset of types
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

if (!(import.meta as any).env.VITE_SUPABASE_URL || !(import.meta as any).env.VITE_SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing. App will use mock data.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
