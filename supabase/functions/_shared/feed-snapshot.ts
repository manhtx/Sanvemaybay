export const FEED_SNAPSHOT_KEY = "active-deals";
export const FEED_SNAPSHOT_TTL_MS = 15 * 60 * 1000;

export function shouldRefreshSnapshot(generatedAt: string | null | undefined, now = Date.now()): boolean {
  const timestamp = generatedAt ? Date.parse(generatedAt) : NaN;
  return !Number.isFinite(timestamp) || now - timestamp >= FEED_SNAPSHOT_TTL_MS;
}
