const STORAGE_KEY = "flycheap.bookmarked-deals";

function readIds(storage: Storage | undefined): string[] {
  if (!storage) return [];
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
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
}

export async function loadRemoteBookmarkedDealIds(): Promise<string[] | undefined> {
  const localIds = getBookmarkedDealIds();
  if (!isSupabaseConfigured) return localIds;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localIds;
    const { data, error } = await supabase.from("user_bookmarks").select("deal_id").eq("user_id", user.id);
    if (error) return localIds;
    const remoteIds = (data ?? []).map((row) => row.deal_id).filter((id): id is string => typeof id === "string");
    const missingRemote = localIds.filter((id) => !remoteIds.includes(id) && !id.startsWith("observed-") && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    if (missingRemote.length > 0) {
      await supabase.from("user_bookmarks").upsert(missingRemote.map((deal_id) => ({ user_id: user.id, deal_id })));
    }
    return [...new Set([...remoteIds, ...localIds])];
  } catch {
    return localIds;
  }
}

export async function saveRemoteBookmark(dealId: string, bookmarked: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  // If dealId is an observed opportunity (not in public.deals), remote database foreign key will reject it.
  // Local storage remains the authoritative cross-type bookmark storage.
  if (dealId.startsWith("observed-") || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealId)) {
    return true;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const result = bookmarked
      ? await supabase.from("user_bookmarks").upsert({ user_id: user.id, deal_id: dealId })
      : await supabase.from("user_bookmarks").delete().eq("user_id", user.id).eq("deal_id", dealId);
    return !result.error;
  } catch {
    return false;
  }
}
import { isSupabaseConfigured, supabase } from "./supabase";
