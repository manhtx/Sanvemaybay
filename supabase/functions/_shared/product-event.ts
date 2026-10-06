export const PRODUCT_EVENT_TYPES = [
  "detail_view",
  "bookmark",
  "share",
  "booking_click",
  "alert_created",
  "web_vital",
  "opportunity_impression",
  "opportunity_open",
  "evidence_engagement",
  "watch_created",
  "watch_matched",
  "verify_click",
  "verify_result",
  "alert_delivered",
  "page_view",
] as const;

export const CURRENT_CORE_WEB_VITALS = ["LCP", "INP", "CLS"] as const;
export const DIAGNOSTIC_WEB_VITALS = ["TTFB"] as const;
export const DEPRECATED_WEB_VITALS = ["FID"] as const;

export function isCurrentCoreWebVital(metric: string): boolean {
  return CURRENT_CORE_WEB_VITALS.includes(metric as (typeof CURRENT_CORE_WEB_VITALS)[number]);
}

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

export interface ValidProductEvent {
  event_type: typeof PRODUCT_EVENT_TYPES[number];
  entity_id: string | null;
  metadata: Record<string, string | number | boolean | null>;
}

export function validateProductEvent(input: unknown): ValidProductEvent | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (!PRODUCT_EVENT_TYPES.includes(value.event_type as ValidProductEvent["event_type"])) return null;
  if (value.entity_id != null && (typeof value.entity_id !== "string" || value.entity_id.length > 120)) return null;
  if (value.metadata != null && (typeof value.metadata !== "object" || Array.isArray(value.metadata))) return null;

  const metadata: ValidProductEvent["metadata"] = {};
  for (const [key, item] of Object.entries((value.metadata ?? {}) as Record<string, unknown>)) {
    if (!allowedMetadata.has(key)) return null;
    if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean" && item !== null) return null;
    if (typeof item === "string" && item.length > 120) return null;
    if (typeof item === "number" && !Number.isFinite(item)) return null;
    metadata[key] = item;
  }
  if (new TextEncoder().encode(JSON.stringify(metadata)).length > 1_500) return null;

  return {
    event_type: value.event_type as ValidProductEvent["event_type"],
    entity_id: (value.entity_id as string | undefined) ?? null,
    metadata,
  };
}
