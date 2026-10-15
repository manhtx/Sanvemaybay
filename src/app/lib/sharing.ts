/**
 * FARELY SHARING & VIRAL LOOPS (F45)
 * 
 * Satisfies:
 * - F45 (P2): Sharing, referrals and viral loops
 * 
 * INVARIANTS:
 * - "Public links without personal information" (No PII leaks: email, auth token, session, watchId)
 * - "Bounded abuse controls" (Rate limiting on sharing actions)
 * - "No misleading stale deal shares" (Explicit freshness disclosure when deal > 24h old)
 */

export interface ShareTarget {
  title: string;
  text: string;
  url: string;
}

export interface ShareNavigator {
  share?: (target: ShareTarget) => Promise<void>;
  clipboard?: { writeText: (value: string) => Promise<void> };
}

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "auth",
  "session",
  "email",
  "user_id",
  "userId",
  "watch_id",
  "watchId",
  "key",
  "secret",
  "pass",
  "password",
  "code",
]);

/**
 * Builds a PII-safe public share URL, stripping any sensitive parameters.
 */
export function buildPiiSafeShareUrl(
  rawUrl: string,
  dealId: string,
  options?: {
    campaign?: string;
    allowedParams?: Record<string, string>;
  }
): string {
  try {
    const parsed = new URL(rawUrl);
    // Canonical path to deal
    parsed.pathname = `/deals/${dealId}`;

    // Filter out all sensitive query parameters
    const safeSearchParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!SENSITIVE_QUERY_KEYS.has(lower) && !lower.includes("token") && !lower.includes("secret") && !lower.includes("auth")) {
        safeSearchParams.set(key, val);
      }
    });

    // Add safe referral & campaign parameters
    safeSearchParams.set("ref", "share");
    safeSearchParams.set("utm_source", "farely");
    safeSearchParams.set("utm_medium", "referral");
    safeSearchParams.set("utm_campaign", options?.campaign || "deal_share");

    if (options?.allowedParams) {
      for (const [k, v] of Object.entries(options.allowedParams)) {
        if (!SENSITIVE_QUERY_KEYS.has(k.toLowerCase())) {
          safeSearchParams.set(k, v);
        }
      }
    }

    parsed.search = safeSearchParams.toString();
    parsed.hash = ""; // strip fragments that might hold tokens
    return parsed.toString();
  } catch {
    // Fallback if rawUrl is invalid
    return `https://farely.manhtx.com/deals/${dealId}?ref=share&utm_source=farely&utm_medium=referral`;
  }
}

/**
 * Formats sharing payload ensuring no stale deal is misrepresented as freshly active.
 */
export function formatSafeShareContent(
  deal: {
    id: string;
    from: string;
    to: string;
    fromCode: string;
    toCode: string;
    price: number;
    observedAt?: string | null;
    departDate: string;
    returnDate?: string | null;
  },
  currentUrl: string
): ShareTarget {
  const safeUrl = buildPiiSafeShareUrl(currentUrl, deal.id);
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(deal.price);

  let isStale = false;
  if (deal.observedAt) {
    const ageMs = Date.now() - new Date(deal.observedAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      isStale = true;
    }
  }

  const title = `${deal.fromCode} → ${deal.toCode} | Farely`;
  let text = `Cơ hội vé máy bay: ${deal.from} → ${deal.to}: ${formattedPrice}`;
  if (isStale) {
    text += " (Lưu ý: Quan sát >24h trước. Giá tại hãng có thể đã biến động)";
  }

  return {
    title,
    text,
    url: safeUrl,
  };
}

// Bounded in-memory share limiter to prevent bot abuse
const shareTimestamps: number[] = [];
const MAX_SHARES_WINDOW_MS = 60_000; // 1 minute
const MAX_SHARES_PER_WINDOW = 20;

export function checkShareRateLimit(): boolean {
  const now = Date.now();
  // Evict timestamps older than window
  while (shareTimestamps.length > 0 && now - shareTimestamps[0] > MAX_SHARES_WINDOW_MS) {
    shareTimestamps.shift();
  }
  if (shareTimestamps.length >= MAX_SHARES_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  shareTimestamps.push(now);
  return true;
}

export function resetShareRateLimitForTest(): void {
  shareTimestamps.length = 0;
}

export async function shareOrCopy(target: ShareTarget, navigatorLike: ShareNavigator): Promise<"shared" | "copied"> {
  if (!checkShareRateLimit()) {
    throw new Error("Bạn đang chia sẻ quá nhanh. Vui lòng chờ một chút trước khi tiếp tục.");
  }

  if (typeof navigatorLike.share === "function") {
    await navigatorLike.share(target);
    return "shared";
  }
  if (navigatorLike.clipboard?.writeText) {
    await navigatorLike.clipboard.writeText(target.url);
    return "copied";
  }
  throw new Error("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.");
}
