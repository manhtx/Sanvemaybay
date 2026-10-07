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

export async function getSavedSessionUser(): Promise<any | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
  } catch {
    return null;
  }
}

export async function loadRemoteSavedOpportunities(): Promise<{
  entries: SavedOpportunityRecord[];
  authenticated: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) return { entries: [], authenticated: false };
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session?.user) return { entries: [], authenticated: false };
    const user = sessionData.session.user;

    const { data, error } = await supabase
      .from("user_saved_opportunities")
      .select("opportunity_id, snapshot_data, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("loadRemoteSavedOpportunities query error:", error);
      return { entries: [], authenticated: true, error: error.message };
    }

    return {
      entries: (data ?? []).map((row) => ({
        opportunityId: row.opportunity_id,
        snapshotData: row.snapshot_data,
        savedAt: row.saved_at,
      })),
      authenticated: true,
    };
  } catch (err: any) {
    return { entries: [], authenticated: false, error: err?.message || "Lỗi nạp danh sách đã lưu" };
  }
}

/**
 * REQ-SAVED-001: Server is canonical authority for authenticated users.
 * Remote load replaces authenticated local cache (no stale union).
 * For anonymous users, local storage remains the local authority.
 */
export async function syncSavedWithRemote(
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage
): Promise<{
  entries: SavedOpportunityRecord[];
  authenticated: boolean;
}> {
  const remote = await loadRemoteSavedOpportunities();
  if (remote.authenticated && !remote.error) {
    // Server authority: replace local cache with remote state
    const ids = remote.entries.map((e) => e.opportunityId);
    storage?.setItem(STORAGE_KEY, JSON.stringify(ids));
    const snapshots: Record<string, { snapshotData: any; savedAt: string }> = {};
    for (const e of remote.entries) {
      if (e.snapshotData) {
        snapshots[e.opportunityId] = { snapshotData: e.snapshotData, savedAt: e.savedAt };
      }
    }
    storage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
    return { entries: remote.entries, authenticated: true };
  }

  // Anonymous user: local is authority
  const localIds = readIds(storage);
  const localSnaps = readLocalSnapshots(storage);
  const entries: SavedOpportunityRecord[] = localIds.map((id) => ({
    opportunityId: id,
    snapshotData: localSnaps[id]?.snapshotData ?? null,
    savedAt: localSnaps[id]?.savedAt ?? new Date().toISOString(),
  }));
  return { entries, authenticated: false };
}

export async function loadRemoteBookmarkedDealIds(
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage
): Promise<string[]> {
  const sync = await syncSavedWithRemote(storage);
  return sync.entries.map((e) => e.opportunityId);
}

export async function mergeLocalBookmarksIntoServer(
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const user = await getSavedSessionUser();
  if (!user) return false;
  const localIds = readIds(storage);
  const localSnaps = readLocalSnapshots(storage);
  if (localIds.length === 0) return true;

  for (const id of localIds) {
    await saveRemoteBookmark(id, true, localSnaps[id]?.snapshotData);
  }
  await syncSavedWithRemote(storage);
  return true;
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

export interface BookmarkMutationResult {
  success: boolean;
  bookmarked: boolean;
  rolledBack?: boolean;
  error?: string;
}

/**
 * REQ-SAVED-002, NC-030: Optimistic mutation with automatic rollback on remote failure.
 * UI update -> remote -> success = commit -> failure = rollback.
 * Does not swallow remote failure.
 */
export async function mutateBookmarkOptimistic(
  id: string,
  targetState?: boolean,
  snapshotData?: Record<string, any>,
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  options?: {
    onRollback?: (previousState: boolean, error: string) => void;
    mockRemoteSaver?: (id: string, bookmarked: boolean, snap?: any) => Promise<boolean>;
  }
): Promise<BookmarkMutationResult> {
  const currentIds = readIds(storage);
  const wasBookmarked = currentIds.includes(id);
  const nextState = targetState !== undefined ? targetState : !wasBookmarked;

  if (nextState === wasBookmarked) {
    return { success: true, bookmarked: wasBookmarked };
  }

  // Optimistic local update
  const previousLocalSnaps = readLocalSnapshots(storage);
  const previousSnap = previousLocalSnaps[id];

  if (nextState) {
    storage?.setItem(STORAGE_KEY, JSON.stringify([...currentIds.filter((x) => x !== id), id]));
    if (snapshotData) {
      previousLocalSnaps[id] = { snapshotData, savedAt: new Date().toISOString() };
      storage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(previousLocalSnaps));
    }
  } else {
    storage?.setItem(STORAGE_KEY, JSON.stringify(currentIds.filter((x) => x !== id)));
    delete previousLocalSnaps[id];
    storage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(previousLocalSnaps));
  }

  const user = await getSavedSessionUser();
  const remoteSaver = options?.mockRemoteSaver ?? saveRemoteBookmark;

  if (user || options?.mockRemoteSaver) {
    const remoteSuccess = await remoteSaver(id, nextState, snapshotData);
    if (!remoteSuccess) {
      // Rollback to prior state!
      if (wasBookmarked) {
        storage?.setItem(STORAGE_KEY, JSON.stringify([...currentIds.filter((x) => x !== id), id]));
        if (previousSnap) {
          previousLocalSnaps[id] = previousSnap;
          storage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(previousLocalSnaps));
        }
      } else {
        storage?.setItem(STORAGE_KEY, JSON.stringify(currentIds.filter((x) => x !== id)));
        delete previousLocalSnaps[id];
        storage?.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(previousLocalSnaps));
      }
      const err = "Lưu thất bại trên máy chủ (Remote mutation rejected)";
      options?.onRollback?.(wasBookmarked, err);
      return {
        success: false,
        bookmarked: wasBookmarked,
        rolledBack: true,
        error: err,
      };
    }
  }

  return { success: true, bookmarked: nextState };
}

