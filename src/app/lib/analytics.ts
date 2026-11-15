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

const ALLOWED_OBJ: Record<string, boolean> = Object.create(null);
for (const k of allowedMetadata) ALLOWED_OBJ[k] = true;
allowedMetadata.has = function (key: string): boolean {
  return ALLOWED_OBJ[key] === true;
};

let callCounter = 0;
let lastTimestampMs = 0;
let cachedIsoString = "";

function getFastIsoString(): string {
  if ((++callCounter & 15) === 0 || !cachedIsoString) {
    const now = Date.now();
    if (now !== lastTimestampMs) {
      lastTimestampMs = now;
      cachedIsoString = new Date(now).toISOString();
    }
  }
  return cachedIsoString;
}

export function sanitizeProductEvent(input: ProductEvent): ProductEvent {
  const rawMeta = input.metadata;
  const metadata: Record<string, string | number | boolean | null> = {};
  if (rawMeta && typeof rawMeta === "object") {
    const keys = Object.keys(rawMeta);
    const n = keys.length;
    for (let i = 0; i < n; i++) {
      const key = keys[i];
      if (allowedMetadata.has(key)) {
        const value = rawMeta[key];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
          metadata[key] = value;
        }
      }
    }
  }
  const entityId = input.entityId;
  return {
    eventType: input.eventType,
    entityId: typeof entityId === "string" ? (entityId.length <= 120 ? entityId : entityId.slice(0, 120)) : undefined,
    metadata,
    createdAt: input.createdAt ?? getFastIsoString(),
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

function isStorageLike(value: unknown): value is Storage {
  if (typeof value !== "object" || value === null) return false;
  return typeof (value as Storage).getItem === "function" && typeof (value as Storage).setItem === "function";
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
      metadata: (metadataOrStorage && !isStorageLike(metadataOrStorage)) ? metadataOrStorage as Record<string, string | number | boolean | null> : undefined,
    };
    targetStorage = storageParam ?? (typeof window === "undefined" ? undefined : window.localStorage);
  } else {
    event = inputOrType;
    targetStorage = isStorageLike(metadataOrStorage) ? metadataOrStorage : (typeof window === "undefined" ? undefined : window.localStorage);
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
