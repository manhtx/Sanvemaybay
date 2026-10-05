import { isSupabaseConfigured, supabase } from "./supabase";

const STORAGE_KEY = "farely.saved-opportunities";
const LEGACY_STORAGE_KEY = "flycheap.bookmarked-deals";
const SNAPSHOT_STORAGE_KEY = "farely.saved-snapshots";

export interface SavedOpportunityRecord {
  opportunityId: string;
  snapshotData?: Record<string, any> | null;
  savedAt: string;
}

export function createOpportunitySnapshot(deal: any): Record<string, any> {
  return {
    opportunityId: deal.opportunityId || deal.id,
    fromCode: deal.fromCode,
    toCode: deal.toCode,
    fromCity: deal.from,
    toCity: deal.to,
    departDate: deal.departDate,
    returnDate: deal.returnDate ?? null,
    savedPrice: Number(deal.price) || 0,
    normalPrice: Number(deal.normalPrice) || Number(deal.price) || 0,
    airline: deal.airline ?? "",
    airlineCode: deal.airlineCode ?? "",
    flightNumber: deal.flightNumber ?? "",
    stops: Number(deal.stops) || 0,
    duration: deal.duration ?? "",
    savedAt: new Date().toISOString(),
    comparatorContext: {
      cohortMedian: deal.comparator?.cohortMedian ?? deal.normalPrice ?? null,
      discountPercentage: deal.discount ?? 0,
      isSufficient: deal.comparator?.isSufficient ?? (deal.confidence ? deal.confidence >= 0.5 : false),
    },
    evidenceContext: {
      freshnessText: deal.expiresIn ?? "",
      observedAt: deal.observedAt ?? null,
    },
  };
}

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

function readLocalSnapshots(storage: Storage | undefined): Record<string, { snapshotData: any; savedAt: string }> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getBookmarkedDealIds(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): string[] {
  return readIds(storage);
}

export function isBookmarkedDeal(id: string, storage?: Storage): boolean {
  return getBookmarkedDealIds(storage).includes(id);
}

export function toggleBookmarkedDeal(
  id: string,
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  snapshotData?: Record<string, any>
): boolean {
  const ids = getBookmarkedDealIds(storage);
  const next = ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  storage?.setItem(STORAGE_KEY, JSON.stringify(next));

  const localSnapshots = readLocalSnapshots(storage);
  if (next.includes(id)) {
    if (snapshotData) {
      localSnapshots[id] = { snapshotData, savedAt: new Date().toISOString() };
    }
  } else {
    delete localSnapshots[id];
  }
  storage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(localSnapshots));

  return next.includes(id);
}

export function getLocalSavedRecord(id: string, storage?: Storage): SavedOpportunityRecord | undefined {
  const snapshots = readLocalSnapshots(storage);
  if (snapshots[id]) {
    return {
      opportunityId: id,
      snapshotData: snapshots[id].snapshotData,
      savedAt: snapshots[id].savedAt,
    };
  }
  return undefined;
}

export function clearBookmarkedDeals(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): void {
  storage?.removeItem(STORAGE_KEY);
  storage?.removeItem(LEGACY_STORAGE_KEY);
  storage?.removeItem(SNAPSHOT_STORAGE_KEY);
}

export async function loadRemoteSavedOpportunities(): Promise<{
  entries: SavedOpportunityRecord[];
  error?: string;
}> {
  if (!isSupabaseConfigured) return { entries: [] };
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session?.user) return { entries: [] };
    const user = sessionData.session.user;

    const { data, error } = await supabase
      .from("user_saved_opportunities")
      .select("opportunity_id, snapshot_data, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("loadRemoteSavedOpportunities query error:", error);
      return { entries: [], error: error.message };
    }

    return {
      entries: (data ?? []).map((row) => ({
        opportunityId: row.opportunity_id,
        snapshotData: row.snapshot_data,
        savedAt: row.saved_at,
      })),
    };
  } catch (err: any) {
    return { entries: [], error: err?.message || "Lỗi nạp danh sách đã lưu" };
  }
}

export async function loadRemoteBookmarkedDealIds(): Promise<string[] | undefined> {
  const localIds = getBookmarkedDealIds();
  if (!isSupabaseConfigured) return localIds;
  try {
    const { entries, error } = await loadRemoteSavedOpportunities();
    if (error) return localIds;

    const remoteIds = entries.map((e) => e.opportunityId);
    return Array.from(new Set([...remoteIds, ...localIds]));
  } catch {
    return localIds;
  }
}

export async function saveRemoteBookmark(
  opportunityId: string,
  bookmarked: boolean,
  snapshotData?: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session?.user) return false;
    const user = sessionData.session.user;

    if (bookmarked) {
      // Fails closed on Supabase returned error
      const { error } = await supabase.from("user_saved_opportunities").upsert({
        user_id: user.id,
        opportunity_id: opportunityId,
        snapshot_data: snapshotData ?? null,
        saved_at: new Date().toISOString(),
      });
      if (error) {
        console.error("user_saved_opportunities remote save error:", error);
        return false;
      }
      return true;
    } else {
      const { error } = await supabase
        .from("user_saved_opportunities")
        .delete()
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunityId);
      if (error) {
        console.error("user_saved_opportunities remote delete error:", error);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error("saveRemoteBookmark exception:", err);
    return false;
  }
}

