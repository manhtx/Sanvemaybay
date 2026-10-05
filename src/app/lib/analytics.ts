import { isSupabaseConfigured, supabase } from "./supabase";
import { reportClientIssue } from "./clientDiagnostics";

export type ProductEventType =
  | "opportunity_impression"
  | "opportunity_open"
  | "detail_view"
  | "evidence_engagement"
  | "watch_created"
  | "alert_created"
  | "watch_matched"
  | "verify_click"
  | "booking_click"
  | "verify_result"
  | "alert_delivered"
  | "bookmark"
  | "share"
  | "web_vital"
  | "page_view";

export interface ProductEvent {
  eventType: ProductEventType;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt?: string;
}

const STORAGE_KEY = "farely.product-events";
const LEGACY_STORAGE_KEY = "flycheap.product-events";
const MAX_LOCAL_EVENTS = 100;
const allowedMetadata = new Set([
  "route",
  "source",
  "channel",
  "bookmarked",
  "provider",
  "device",
  "metric",
  "value",
  "delta",
  "rating",
  "navigation_type",
  "opportunity_id",
  "watch_id",
  "environment",
  "release",
  "synthetic",
  "verification_run_id",
  "target_price",
  "page",
]);

export function sanitizeProductEvent(input: ProductEvent): ProductEvent {
  const metadata = Object.fromEntries(Object.entries(input.metadata ?? {})
    .filter(([key, value]) => allowedMetadata.has(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null)));
  return {
    eventType: input.eventType,
    entityId: typeof input.entityId === "string" ? input.entityId.slice(0, 120) : undefined,
    metadata,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function readLocalProductEvents(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): ProductEvent[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY) ?? "[]";
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.slice(-MAX_LOCAL_EVENTS) : [];
  } catch { return []; }
}

export function appendLocalProductEvent(event: ProductEvent, storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): ProductEvent[] {
  const local = [...readLocalProductEvents(storage), event].slice(-MAX_LOCAL_EVENTS);
  storage?.setItem(STORAGE_KEY, JSON.stringify(local));
  return local;
}

export async function trackProductEvent(
  inputOrType: ProductEvent | ProductEventType,
  metadataOrStorage?: Record<string, string | number | boolean | null> | Storage,
  entityId?: string,
  storageParam?: Storage,
): Promise<void> {
  let event: ProductEvent;
  let targetStorage: Storage | undefined;

  if (typeof inputOrType === "string") {
    event = {
      eventType: inputOrType,
      entityId,
      metadata: (metadataOrStorage && !(metadataOrStorage instanceof Storage)) ? metadataOrStorage as Record<string, string | number | boolean | null> : undefined,
    };
    targetStorage = storageParam ?? (typeof window === "undefined" ? undefined : window.localStorage);
  } else {
    event = inputOrType;
    targetStorage = (metadataOrStorage instanceof Storage) ? metadataOrStorage : (typeof window === "undefined" ? undefined : window.localStorage);
  }

  const sanitized = sanitizeProductEvent(event);
  appendLocalProductEvent(sanitized, targetStorage);
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.functions.invoke("track-event", {
      body: { event_type: sanitized.eventType, entity_id: sanitized.entityId ?? null, metadata: sanitized.metadata },
    });
    if (error) reportClientIssue("product_analytics_unavailable");
  } catch {
    reportClientIssue("product_analytics_unavailable");
  }
}
