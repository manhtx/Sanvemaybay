import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { computeWatchStatus, WatchIntent, WatchStatus } from "../domain/watch";
import { reportClientIssue } from "../lib/clientDiagnostics";

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
  email: string;
  channel?: "email" | "telegram";
  telegramId?: string;
  frequency?: "instant" | "daily";
  turnstileToken?: string;
}

function getLocalWatches(): WatchIntent[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WATCHES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalWatches(watches: WatchIntent[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_WATCHES_KEY, JSON.stringify(watches));
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
      return localWatches;
    }

    const { data, error } = await supabase
      .from("user_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      reportClientIssue("watch_fetch_remote_failed");
      return localWatches;
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

    // Merge any unique local watches not on remote
    const remoteIds = new Set(remoteWatches.map((w) => w.id));
    const merged = [
      ...remoteWatches,
      ...localWatches.filter((w) => !remoteIds.has(w.id)),
    ];
    return merged;
  } catch {
    reportClientIssue("watch_fetch_unexpected_error");
    return localWatches;
  }
}

export async function createWatch(
  input: CreateWatchInput,
): Promise<{ success: boolean; watchId: string }> {
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
    status: "monitoring",
    frequency: input.frequency || "instant",
    email: input.email,
    channel: input.channel || "email",
    telegramId: input.telegramId || null,
    lastCheckedAt: now,
    lastMatchAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured) {
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
          email: input.email,
          notify_email: true,
          notify_telegram: input.channel === "telegram",
          telegram_id: input.telegramId || null,
          frequency: input.frequency || "instant",
          status: "active",
          last_checked_at: now,
        });

        if (!error) {
          newWatch.userId = user.id;
        }
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
                discount_threshold: 20,
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
        if (!error && data?.success) {
          if (Array.isArray(data.alert_ids) && data.alert_ids[0]) {
            newWatch.id = data.alert_ids[0];
          }
        }
      }
    } catch {
      // Fall through to local persistence
    }
  }

  // Always save to local store as durable offline / client backup
  const locals = getLocalWatches();
  saveLocalWatches([newWatch, ...locals.filter((w) => w.id !== newWatch.id)]);

  return { success: true, watchId: newWatch.id };
}

export async function pauseWatch(id: string): Promise<void> {
  const locals = getLocalWatches();
  const updated = locals.map((w) =>
    w.id === id ? { ...w, status: "paused" as WatchStatus, updatedAt: new Date().toISOString() } : w,
  );
  saveLocalWatches(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("user_alerts")
        .update({ status: "paused", updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch {
      // Ignore
    }
  }
}

export async function resumeWatch(id: string): Promise<void> {
  const locals = getLocalWatches();
  const updated = locals.map((w) =>
    w.id === id ? { ...w, status: "monitoring" as WatchStatus, updatedAt: new Date().toISOString() } : w,
  );
  saveLocalWatches(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("user_alerts")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch {
      // Ignore
    }
  }
}

export async function deleteWatch(id: string): Promise<void> {
  const locals = getLocalWatches();
  saveLocalWatches(locals.filter((w) => w.id !== id));

  if (isSupabaseConfigured) {
    try {
      await supabase.from("user_alerts").delete().eq("id", id);
    } catch {
      // Ignore
    }
  }
}
