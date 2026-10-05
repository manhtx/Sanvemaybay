import { isSupabaseConfigured, supabase } from "./supabase";

const STORAGE_KEY = "farely.saved-opportunities";
const LEGACY_STORAGE_KEY = "flycheap.bookmarked-deals";

function readIds(storage: Storage | undefined): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY) ?? "[]";
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function getBookmarkedDealIds(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): string[] {
  return readIds(storage);
}

export function isBookmarkedDeal(id: string, storage?: Storage): boolean {
  return getBookmarkedDealIds(storage).includes(id);
}

export function toggleBookmarkedDeal(id: string, storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): boolean {
  const ids = getBookmarkedDealIds(storage);
  const next = ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  return next.includes(id);
}

export function clearBookmarkedDeals(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): void {
  storage?.removeItem(STORAGE_KEY);
  storage?.removeItem(LEGACY_STORAGE_KEY);
}

export async function loadRemoteBookmarkedDealIds(): Promise<string[] | undefined> {
  const localIds = getBookmarkedDealIds();
  if (!isSupabaseConfigured) return localIds;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return localIds;

    // 1. Query user_saved_opportunities
    const { data: savedData, error: savedError } = await supabase
      .from("user_saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", user.id);

    // 2. Query legacy user_bookmarks for backward compatibility
    const { data: legacyData } = await supabase
      .from("user_bookmarks")
      .select("deal_id")
      .eq("user_id", user.id);

    const remoteSavedIds = (savedData ?? []).map((row) => row.opportunity_id).filter((id): id is string => typeof id === "string");
    const remoteLegacyIds = (legacyData ?? []).map((row) => row.deal_id).filter((id): id is string => typeof id === "string");
    const allRemoteIds = Array.from(new Set([...remoteSavedIds, ...remoteLegacyIds]));

    // If user has local items not yet synced remotely, backfill them to user_saved_opportunities
    const missingRemote = localIds.filter((id) => !allRemoteIds.includes(id));
    if (missingRemote.length > 0 && !savedError) {
      await supabase.from("user_saved_opportunities").upsert(
        missingRemote.map((opportunity_id) => ({
          user_id: user.id,
          opportunity_id,
          saved_at: new Date().toISOString(),
        }))
      );
    }

    return Array.from(new Set([...allRemoteIds, ...localIds]));
  } catch {
    return localIds;
  }
}

export async function saveRemoteBookmark(opportunityId: string, bookmarked: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return false;

    if (bookmarked) {
      // Save to durable user_saved_opportunities
      await supabase.from("user_saved_opportunities").upsert({
        user_id: user.id,
        opportunity_id: opportunityId,
        saved_at: new Date().toISOString(),
      });
      // Also try legacy user_bookmarks if it's a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opportunityId)) {
        await supabase.from("user_bookmarks").upsert({ user_id: user.id, deal_id: opportunityId });
      }
      return true;
    } else {
      // Remove from both
      await supabase.from("user_saved_opportunities").delete().eq("user_id", user.id).eq("opportunity_id", opportunityId);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opportunityId)) {
        await supabase.from("user_bookmarks").delete().eq("user_id", user.id).eq("deal_id", opportunityId);
      }
      return true;
    }
  } catch {
    return false;
  }
}
