import { isSupabaseConfigured, supabase } from "../lib/supabase.ts";
import { computeWatchStatus, WatchIntent, WatchStatus } from "../domain/watch.ts";
import { reportClientIssue } from "../lib/clientDiagnostics.ts";

const LOCAL_STORAGE_WATCHES_KEY = "farely_local_watches_v1";

export interface CreateWatchInput {
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  targetPrice?: number;
  currentPrice?: number;
  maxStops?: number;
  dateFrom?: string;
  dateTo?: string;
  returnDate?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  journeyType?: "one_way" | "round_trip";
  email: string;
  channel?: "email" | "telegram";
  telegramId?: string;
  frequency?: "instant" | "daily" | "weekly";
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  turnstileToken?: string;
  passengers?: number;
  passengerMix?: {
    adults: number;
    children: number;
    infants: number;
  };
  cabin?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
}

function getStorage(): Storage | undefined {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return undefined;
}

function getLocalWatches(storage?: Storage): WatchIntent[] {
  const store = storage ?? getStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(LOCAL_STORAGE_WATCHES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalWatches(watches: WatchIntent[], storage?: Storage): void {
  const store = storage ?? getStorage();
  if (!store) return;
  try {
    store.setItem(LOCAL_STORAGE_WATCHES_KEY, JSON.stringify(watches));
  } catch {
    // Ignore localStorage write error
  }
}

export async function getWatches(): Promise<WatchIntent[]> {
  const localWatches = getLocalWatches();

  if (!isSupabaseConfigured) {
    return localWatches;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      // Unauthenticated: only return local watches that don't belong to a registered user
      return localWatches.filter((w) => !w.userId);
    }

    const { data, error } = await supabase
      .from("user_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      reportClientIssue("watch_fetch_remote_failed");
      // On remote fetch failure for authenticated user, do not leak or crossover other users' data!
      // Return only local watches specifically matching this user's id or unassigned matching email
      return localWatches.filter((w) => w.userId === user.id || (!w.userId && w.email === user.email));
    }

    const remoteWatches: WatchIntent[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      originCode: row.origin_code || "HAN",
      originName: row.origin_code || "Hà Nội",
      destinationCode: row.destination_code || "",
      destinationName: row.destination || row.destination_code || "Điểm đến",
      dateFrom: row.date_from || null,
      dateTo: row.date_to || null,
      targetPrice: row.target_price || row.budget || null,
      latestPrice: row.latest_price || null,
      maxStops: row.max_stops ?? null,
      status: computeWatchStatus({
        status: row.status,
        dateTo: row.date_to,
        lastMatchAt: row.last_match_at,
        lastCheckedAt: row.last_checked_at,
        targetPrice: row.target_price || row.budget,
        latestPrice: row.latest_price,
      }),
      frequency: row.frequency === "daily" ? "daily" : "instant",
      email: row.email || user.email || "",
      channel: row.notify_telegram ? "telegram" : "email",
      telegramId: row.telegram_id || null,
      lastCheckedAt: row.last_checked_at || null,
      lastMatchAt: row.last_match_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }));

    // For authenticated user: remote is authoritative.
    // Only reconcile unassigned local watches that match this user's email,
    // NEVER leak or include local watches that belong to another user!
    const remoteIds = new Set(remoteWatches.map((w) => w.id));
    const eligibleLocalWatches = localWatches.filter((w) => {
      if (remoteIds.has(w.id)) return false;
      if (w.userId) return w.userId === user.id;
      return !w.email || w.email === user.email;
    });

    return [...remoteWatches, ...eligibleLocalWatches];
  } catch {
    reportClientIssue("watch_fetch_unexpected_error");
    return [];
  }
}

export async function createWatch(
  input: CreateWatchInput,
): Promise<{ success: boolean; watchId: string; error?: string }> {
  const watchId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newWatch: WatchIntent = {
    id: watchId,
    originCode: input.originCode,
    originName: input.originName,
    destinationCode: input.destinationCode,
    destinationName: input.destinationName,
    targetPrice: input.targetPrice || null,
    latestPrice: input.currentPrice || null,
    maxStops: input.maxStops ?? null,
    dateFrom: input.dateFrom || null,
    dateTo: input.dateTo || null,
    returnDate: input.returnDate || null,
    tripType: input.journeyType === "round_trip" || input.returnDate ? "roundtrip" : "oneway",
    passengers: input.passengers ?? (input.passengerMix ? (input.passengerMix.adults + input.passengerMix.children + input.passengerMix.infants) : 1),
    passengerMix: input.passengerMix || null,
    cabin: input.cabin || "economy",
    currency: input.currency || "VND",
    status: isSupabaseConfigured ? "monitoring" : "local_draft",
    frequency: input.frequency || "instant",
    quietHoursEnabled: input.quietHoursEnabled ?? null,
    quietHoursStart: input.quietHoursStart ?? null,
    quietHoursEnd: input.quietHoursEnd ?? null,
    email: input.email,
    channel: input.channel || "email",
    telegramId: input.telegramId || null,
    lastCheckedAt: null, // Critical: NULL on creation! First evaluation sets it
    lastMatchAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!isSupabaseConfigured) {
    // Cannot claim active server monitoring when Supabase is unconfigured (AUD-V34-06, EV34-18)
    newWatch.status = "local_draft";
    const locals = getLocalWatches();
    saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);
    return { success: true, watchId: newWatch.id };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      // Authenticated direct persist
      const { error } = await supabase.from("user_alerts").insert({
        id: watchId,
        user_id: user.id,
        origin_code: input.originCode,
        destination: input.destinationName,
        destination_code: input.destinationCode,
        budget: input.targetPrice || null,
        target_price: input.targetPrice || null,
        latest_price: input.currentPrice || null,
        max_stops: input.maxStops ?? null,
        date_from: input.dateFrom || null,
        date_to: input.dateTo || null,
        return_date: input.returnDate || null,
        trip_type: input.journeyType === "round_trip" || input.returnDate ? "roundtrip" : "oneway",
        email: input.email || user.email,
        notify_email: true,
        notify_telegram: input.channel === "telegram",
        telegram_id: input.telegramId || null,
        frequency: input.frequency || "instant",
        status: "active",
        last_checked_at: null, // Real monitoring will set this!
      });

      if (error) {
        reportClientIssue("watch_activation_failed");
        newWatch.status = "sync_failed";
        const locals = getLocalWatches();
        saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);
        return { success: false, watchId: newWatch.id, error: "Không thể kích hoạt theo dõi trên máy chủ." };
      }
      newWatch.userId = user.id;
      newWatch.status = "monitoring";
    } else if (input.turnstileToken) {
      // Unauthenticated alert setup via Edge Function
      const { data, error } = await supabase.functions.invoke("setup-alert", {
        body: {
          turnstile_token: input.turnstileToken,
          alerts: [
            {
              origin_code: input.originCode,
              destination: input.destinationName,
              destination_code: input.destinationCode,
              budget: input.targetPrice,
              discount_threshold: null, // Do not secretly inject 20% discount!
              email: input.email,
              notify_email: true,
              notify_telegram: input.channel === "telegram",
              telegram_id: input.telegramId,
              channel: input.channel || "email",
              frequency: input.frequency || "instant",
              date_from: input.dateFrom,
              date_to: input.dateTo,
            },
          ],
        },
      });
      if (error || !data?.success) {
        reportClientIssue("watch_anonymous_activation_failed");
        newWatch.status = "sync_failed";
        const locals = getLocalWatches();
        saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);
        return { success: false, watchId: newWatch.id, error: "Xác thực bảo vệ không thành công." };
      }
      if (Array.isArray(data.alert_ids) && data.alert_ids[0]) {
        newWatch.id = data.alert_ids[0];
      }
      newWatch.status = "monitoring";
    } else {
      // Anonymous without turnstile cannot claim active server monitoring
      newWatch.status = "local_draft";
      const locals = getLocalWatches();
      saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);
      return { success: false, watchId: newWatch.id, error: "Vui lòng đăng nhập để bắt đầu theo dõi tự động." };
    }
  } catch {
    reportClientIssue("watch_creation_exception");
    newWatch.status = "sync_failed";
    const locals = getLocalWatches();
    saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);
    return { success: false, watchId: newWatch.id, error: "Lỗi kết nối khi tạo theo dõi." };
  }

  // Save to local store as durable offline / client backup
  const locals = getLocalWatches();
  saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);

  return { success: true, watchId: newWatch.id };
}

export interface WatchMutationResult {
  success: boolean;
  rolledBack?: boolean;
  error?: string;
}

export async function pauseWatch(
  id: string,
  options?: {
    onRollback?: (previousWatch: WatchIntent, error: string) => void;
    mockRemoteUpdater?: (id: string, status: string) => Promise<boolean>;
  }
): Promise<WatchMutationResult> {
  const locals = getLocalWatches();
  const priorWatch = locals.find((w) => w.id === id);
  if (!priorWatch) {
    return { success: false, error: "Không tìm thấy hợp đồng theo dõi." };
  }

  // Optimistic update
  const updated = locals.map((w) =>
    w.id === id ? { ...w, status: "paused" as WatchStatus, updatedAt: new Date().toISOString() } : w
  );
  saveLocalWatches(updated);

  if (options?.mockRemoteUpdater) {
    const ok = await options.mockRemoteUpdater(id, "paused");
    if (!ok) {
      saveLocalWatches(locals);
      options.onRollback?.(priorWatch, "Lỗi máy chủ khi tạm dừng theo dõi.");
      return { success: false, rolledBack: true, error: "Lỗi máy chủ khi tạm dừng theo dõi." };
    }
    return { success: true };
  }

  if (isSupabaseConfigured) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const { data, error } = await supabase
          .from("user_alerts")
          .update({ status: "paused", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id");

        if (error || !data || data.length === 0) {
          saveLocalWatches(locals);
          reportClientIssue("watch_pause_remote_failed");
          const errMsg = error?.message || "Không tìm thấy thông báo hoặc bạn không có quyền cập nhật trên máy chủ.";
          options?.onRollback?.(priorWatch, errMsg);
          return { success: false, rolledBack: true, error: errMsg };
        }
      } else if (priorWatch.userId) {
        saveLocalWatches(locals);
        reportClientIssue("watch_pause_auth_expired");
        const errMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để cập nhật theo dõi.";
        options?.onRollback?.(priorWatch, errMsg);
        return { success: false, rolledBack: true, error: errMsg };
      }
    } catch (err: any) {
      saveLocalWatches(locals);
      reportClientIssue("watch_pause_exception");
      const errMsg = err?.message || "Lỗi kết nối khi tạm dừng theo dõi.";
      options?.onRollback?.(priorWatch, errMsg);
      return { success: false, rolledBack: true, error: errMsg };
    }
  }

  return { success: true };
}

export async function resumeWatch(
  id: string,
  options?: {
    onRollback?: (previousWatch: WatchIntent, error: string) => void;
    mockRemoteUpdater?: (id: string, status: string) => Promise<boolean>;
  }
): Promise<WatchMutationResult> {
  const locals = getLocalWatches();
  const priorWatch = locals.find((w) => w.id === id);
  if (!priorWatch) {
    return { success: false, error: "Không tìm thấy hợp đồng theo dõi." };
  }

  // Optimistic update
  const updated = locals.map((w) =>
    w.id === id ? { ...w, status: "monitoring" as WatchStatus, updatedAt: new Date().toISOString() } : w
  );
  saveLocalWatches(updated);

  if (options?.mockRemoteUpdater) {
    const ok = await options.mockRemoteUpdater(id, "active");
    if (!ok) {
      saveLocalWatches(locals);
      options.onRollback?.(priorWatch, "Lỗi máy chủ khi tiếp tục theo dõi.");
      return { success: false, rolledBack: true, error: "Lỗi máy chủ khi tiếp tục theo dõi." };
    }
    return { success: true };
  }

  if (isSupabaseConfigured) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const { data, error } = await supabase
          .from("user_alerts")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id");

        if (error || !data || data.length === 0) {
          saveLocalWatches(locals);
          reportClientIssue("watch_resume_remote_failed");
          const errMsg = error?.message || "Không tìm thấy thông báo hoặc bạn không có quyền cập nhật trên máy chủ.";
          options?.onRollback?.(priorWatch, errMsg);
          return { success: false, rolledBack: true, error: errMsg };
        }
      } else if (priorWatch.userId) {
        saveLocalWatches(locals);
        reportClientIssue("watch_resume_auth_expired");
        const errMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục theo dõi.";
        options?.onRollback?.(priorWatch, errMsg);
        return { success: false, rolledBack: true, error: errMsg };
      }
    } catch (err: any) {
      saveLocalWatches(locals);
      reportClientIssue("watch_resume_exception");
      const errMsg = err?.message || "Lỗi kết nối khi tiếp tục theo dõi.";
      options?.onRollback?.(priorWatch, errMsg);
      return { success: false, rolledBack: true, error: errMsg };
    }
  }

  return { success: true };
}

export async function deleteWatch(
  id: string,
  options?: {
    onRollback?: (previousWatch: WatchIntent, error: string) => void;
    mockRemoteDeleter?: (id: string) => Promise<boolean>;
  }
): Promise<WatchMutationResult> {
  const locals = getLocalWatches();
  const priorWatch = locals.find((w) => w.id === id);
  if (!priorWatch) {
    return { success: false, error: "Không tìm thấy hợp đồng theo dõi." };
  }

  // Optimistic delete
  saveLocalWatches(locals.filter((w) => w.id !== id));

  if (options?.mockRemoteDeleter) {
    const ok = await options.mockRemoteDeleter(id);
    if (!ok) {
      saveLocalWatches(locals);
      options.onRollback?.(priorWatch, "Lỗi máy chủ khi hủy theo dõi.");
      return { success: false, rolledBack: true, error: "Lỗi máy chủ khi hủy theo dõi." };
    }
    return { success: true };
  }

  if (isSupabaseConfigured) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const { data, error } = await supabase
          .from("user_alerts")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id");

        if (error || !data || data.length === 0) {
          saveLocalWatches(locals);
          reportClientIssue("watch_delete_remote_failed");
          const errMsg = error?.message || "Không tìm thấy thông báo hoặc bạn không có quyền xóa trên máy chủ.";
          options?.onRollback?.(priorWatch, errMsg);
          return { success: false, rolledBack: true, error: errMsg };
        }
      } else if (priorWatch.userId) {
        saveLocalWatches(locals);
        reportClientIssue("watch_delete_auth_expired");
        const errMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để hủy theo dõi.";
        options?.onRollback?.(priorWatch, errMsg);
        return { success: false, rolledBack: true, error: errMsg };
      }
    } catch (err: any) {
      saveLocalWatches(locals);
      reportClientIssue("watch_delete_exception");
      const errMsg = err?.message || "Lỗi kết nối khi hủy theo dõi.";
      options?.onRollback?.(priorWatch, errMsg);
      return { success: false, rolledBack: true, error: errMsg };
    }
  }

  return { success: true };
}
