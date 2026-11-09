export interface OriginOption {
  code: string;
  name: string;
}

/**
 * Extracts and deduplicates unique origin options from tracked routes.
 * REQ-DOM-004, REQ-DOM-001:
 * - Preserves first-seen insertion order and display name.
 * - Defensively normalizes airport codes (trimmed, uppercase).
 * - Fails closed on null, undefined, non-array, or corrupt entries without throwing.
 */
export function uniqueOrigins(
  routes?: ReadonlyArray<{ originCode?: string | null; originName?: string | null }> | null
): OriginOption[] {
  if (!routes || !Array.isArray(routes)) return [];
  const origins = new Map<string, OriginOption>();
  for (const route of routes) {
    if (!route || typeof route !== 'object') continue;
    const code = (route.originCode ?? '').trim().toUpperCase();
    const name = (route.originName ?? '').trim();
    if (!code) continue;
    if (!origins.has(code)) {
      origins.set(code, { code, name: name || code });
    }
  }
  return [...origins.values()];
}
