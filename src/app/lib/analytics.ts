import { isSupabaseConfigured, supabase } from "./supabase";

export type ProductEventType = "detail_view" | "bookmark" | "share" | "booking_click" | "alert_created";
export interface ProductEvent {
  eventType: ProductEventType;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt?: string;
}

const STORAGE_KEY = "flycheap.product-events";
const MAX_LOCAL_EVENTS = 100;
const allowedMetadata = new Set(["route", "source", "channel", "bookmarked", "provider", "device"]);

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
    const value = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.slice(-MAX_LOCAL_EVENTS) : [];
  } catch { return []; }
}

export function appendLocalProductEvent(event: ProductEvent, storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): ProductEvent[] {
  const local = [...readLocalProductEvents(storage), event].slice(-MAX_LOCAL_EVENTS);
  storage?.setItem(STORAGE_KEY, JSON.stringify(local));
  return local;
}

export async function trackProductEvent(input: ProductEvent, storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): Promise<void> {
  const event = sanitizeProductEvent(input);
  appendLocalProductEvent(event, storage);
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("product_events").insert({ event_type: event.eventType, entity_id: event.entityId ?? null, metadata: event.metadata });
    if (error) console.warn("Product analytics unavailable.", error.message);
  } catch (error) {
    console.warn("Product analytics unavailable.", error);
  }
}
