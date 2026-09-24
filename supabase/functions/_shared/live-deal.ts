const LIVE_LINK_KINDS = new Set(["live_source", "live_affiliate"]);

export function approvedBookingHosts(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean));
}

export function isApprovedHttpsUrl(value: unknown, approvedHosts: Set<string>): value is string {
  if (typeof value !== "string" || approvedHosts.size === 0) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && [...approvedHosts].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function isActiveLiveDeal(
  deal: Record<string, unknown>,
  approvedHosts: Set<string>,
  now = new Date(),
): boolean {
  if (!LIVE_LINK_KINDS.has(String(deal.link_kind ?? ""))) return false;
  const departDate = new Date(`${String(deal.depart_date ?? "")}T00:00:00Z`);
  const validUntil = new Date(String(deal.valid_until ?? ""));
  if (!(departDate > now) || !(validUntil > now)) return false;
  if (!(Number(deal.price) > 0) || !String(deal.duration ?? "").trim()) return false;
  if (deal.link_kind === "live_affiliate") {
    return Boolean(String(deal.affiliate_network ?? "").trim()) &&
      isApprovedHttpsUrl(deal.affiliate_url, approvedHosts);
  }
  return isApprovedHttpsUrl(deal.booking_url, approvedHosts);
}
