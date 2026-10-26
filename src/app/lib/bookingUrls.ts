/**
 * Booking URL Generator — Farely
 * 
 * RULES:
 * - Traveloka: KHÔNG dùng deep link vì họ dùng internal airport codes riêng
 *   (HAN trong Traveloka = Jakarta Halim, không phải Nội Bài)
 * - Google Flights carries route/date parameters in a public search URL.
 * - Skyscanner and Kayak are optional comparison links.
 */

export interface BookingParams {
  fromCode: string;
  toCode: string;
  departDate: string;   // YYYY-MM-DD
  returnDate?: string;  // YYYY-MM-DD
  airline?: string;
  airlineCode?: string;
  tripType?: string;    // "domestic" | "international"
  price?: number;
  passengers?: number;
  passengerMix?: {
    adults: number;
    children?: number;
    infants?: number;
  };
}

export const APPROVED_BOOKING_DOMAINS = new Set([
  "google.com",
  "skyscanner.com",
  "skyscanner.net",
  "kayak.com",
  "vietjetair.com",
  "vietnamairlines.com",
  "bambooairways.com",
  "vietravelairlines.com",
  "tripadvisor.com",
  "partner.example",
]);

/**
 * Validates that an outbound partner booking URL is HTTPS and belongs to an approved partner domain.
 */
export function isSafeOutboundBookingUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:") return false;
    // Reject embedded credentials (userinfo) in outbound URLs
    if (parsed.username || parsed.password) return false;
    // Disallow non-standard ports (must be default HTTPS port 443 or empty)
    if (parsed.port && parsed.port !== "443") return false;
    const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
    return Array.from(APPROVED_BOOKING_DOMAINS).some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates 3-letter IATA airport codes.
 * Strips whitespace, uppercase converts, and ensures exactly 3 alphanumeric characters.
 */
export function sanitizeIataAirportCode(code: string): string {
  const cleaned = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  return cleaned.length === 3 ? cleaned : '';
}

/**
 * Converts YYYY-MM-DD → YYMMDD (Skyscanner URL format)
 */
function toSkyDate(date: string): string {
  const digits = (date || '').replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(2, 8); // YYMMDD
  }
  return digits;
}

/**
 * Google Flights ?q= format — CONFIRMED WORKING (verified 2025-04-07)
 * Tab title shows "Hà Nội đi Phú Quốc | Google Chuyến bay" = đúng route
 * 
 * Format: ?q=Flights to [DEST] from [ORIG] on [DEPART] through [RETURN]
 */
export function buildGoogleFlightsUrl(p: BookingParams): string {
  const from = sanitizeIataAirportCode(p.fromCode);
  const to = sanitizeIataAirportCode(p.toCode);
  if (!from || !to) {
    return "https://www.google.com/travel/flights?hl=vi&curr=VND";
  }
  const parts = [`Flights to ${to} from ${from} on ${p.departDate}`];
  if (p.returnDate && p.returnDate >= p.departDate) parts.push(`through ${p.returnDate}`);
  const query = encodeURIComponent(parts.join(' '));
  return `https://www.google.com/travel/flights?q=${query}&hl=vi&curr=VND`;
}

/**
 * Skyscanner — format YYMMDD, stable API
 */
export function buildSkyscannerUrl(p: BookingParams): string {
  const from = sanitizeIataAirportCode(p.fromCode).toLowerCase();
  const to = sanitizeIataAirportCode(p.toCode).toLowerCase();
  if (!from || !to) {
    return "";
  }
  const dep = toSkyDate(p.departDate);
  const adults = Math.floor(Math.max(1, p.passengerMix?.adults ?? p.passengers ?? 1));
  const children = Math.floor(Math.max(0, p.passengerMix?.children ?? 0));
  const infants = Math.floor(Math.max(0, p.passengerMix?.infants ?? 0));
  let passParams = `adults=${adults}`;
  if (children > 0) passParams += `&children=${children}`;
  if (infants > 0) passParams += `&infants=${infants}`;

  if (p.returnDate && p.returnDate >= p.departDate) {
    const ret = toSkyDate(p.returnDate);
    return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/${ret}/?${passParams}&cabinclass=economy&currency=vnd`;
  }
  return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/?${passParams}&cabinclass=economy&currency=vnd`;
}

/**
 * Kayak — reliable international aggregator
 */
export function buildKayakUrl(p: BookingParams): string {
  const from = sanitizeIataAirportCode(p.fromCode);
  const to = sanitizeIataAirportCode(p.toCode);
  if (!from || !to) {
    return "";
  }
  const adults = Math.floor(Math.max(1, p.passengerMix?.adults ?? p.passengers ?? 1));
  const children = Math.floor(Math.max(0, p.passengerMix?.children ?? 0));
  let passParams = `adults=${adults}`;
  if (children > 0) passParams += `&children=${children}`;

  if (p.returnDate && p.returnDate >= p.departDate) {
    return `https://www.kayak.com/flights/${from}-${to}/${p.departDate}/${p.returnDate}?${passParams}&currency=VND`;
  }
  return `https://www.kayak.com/flights/${from}-${to}/${p.departDate}?${passParams}&currency=VND`;
}

/**
 * Use Google Flights as the primary link. Airline booking flows change often,
 * so an unverified airline deep link must not be presented as reliable.
 */
export function getBestBookingUrl(p: BookingParams): string {
  return buildGoogleFlightsUrl(p);
}

/** Use an affiliate URL only when the server marked it as live and approved, and the target is verified safe. */
export function getEffectiveDealBookingUrl(deal: {
  affiliateUrl?: string;
  affiliateNetwork?: string;
  linkKind?: string;
  bookingUrl?: string;
}, fallback: string): string {
  if (deal.linkKind === "live_affiliate" && deal.affiliateNetwork && deal.affiliateUrl) {
    if (isSafeOutboundBookingUrl(deal.affiliateUrl)) {
      return deal.affiliateUrl;
    }
  }
  if (deal.bookingUrl && isSafeOutboundBookingUrl(deal.bookingUrl)) {
    return deal.bookingUrl;
  }
  return fallback;
}

/**
 * Get ALL booking options for the UI panel
 * 
 * Shown as pill buttons so user can choose their preferred platform.
 * NOTE: Traveloka NOT included — their internal airport code system
 * does NOT match IATA codes (HAN = Jakarta Halim in their system).
 */
export function getAllBookingOptions(p: BookingParams): Array<{
  label: string;
  url: string;
  icon: string;
  note: string;
  isPrimary?: boolean;
}> {
  const options: Array<{
    label: string;
    url: string;
    icon: string;
    note: string;
    isPrimary?: boolean;
  }> = [{
    label: 'Google Flights',
    url: buildGoogleFlightsUrl(p),
    icon: '✈️',
    note: 'So sánh tất cả hãng bay',
    isPrimary: true,
  }];

  options.push({
    label: 'Skyscanner',
    url: buildSkyscannerUrl(p),
    icon: '🔍',
    note: 'So sánh + lịch giá rẻ theo ngày',
  });

  options.push({
    label: 'Kayak',
    url: buildKayakUrl(p),
    icon: '🛶',
    note: 'Tìm giá thấp nhất + khách sạn',
  });

  return options;
}
