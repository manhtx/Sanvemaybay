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

/**
 * Converts YYYY-MM-DD → YYMMDD (Skyscanner URL format)
 */
function toSkyDate(date: string): string {
  return date.replace(/-/g, '').slice(2); // "2026-06-22" → "260622"
}

/**
 * Google Flights ?q= format — CONFIRMED WORKING (verified 2025-04-07)
 * Tab title shows "Hà Nội đi Phú Quốc | Google Chuyến bay" = đúng route
 * 
 * Format: ?q=Flights to [DEST] from [ORIG] on [DEPART] through [RETURN]
 */
export function buildGoogleFlightsUrl(p: BookingParams): string {
  const parts = [`Flights to ${p.toCode} from ${p.fromCode} on ${p.departDate}`];
  if (p.returnDate) parts.push(`through ${p.returnDate}`);
  const query = encodeURIComponent(parts.join(' '));
  return `https://www.google.com/travel/flights?q=${query}&hl=vi&curr=VND`;
}

/**
 * Skyscanner — format YYMMDD, stable API
 */
export function buildSkyscannerUrl(p: BookingParams): string {
  const dep = toSkyDate(p.departDate);
  const from = p.fromCode.toLowerCase();
  const to = p.toCode.toLowerCase();
  const adults = p.passengerMix?.adults ?? p.passengers ?? 1;
  const children = p.passengerMix?.children ?? 0;
  const infants = p.passengerMix?.infants ?? 0;
  let passParams = `adults=${adults}`;
  if (children > 0) passParams += `&children=${children}`;
  if (infants > 0) passParams += `&infants=${infants}`;

  if (p.returnDate) {
    const ret = toSkyDate(p.returnDate);
    return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/${ret}/?${passParams}&cabinclass=economy&currency=vnd`;
  }
  return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/?${passParams}&cabinclass=economy&currency=vnd`;
}

/**
 * Kayak — reliable international aggregator
 */
export function buildKayakUrl(p: BookingParams): string {
  const adults = p.passengerMix?.adults ?? p.passengers ?? 1;
  const children = p.passengerMix?.children ?? 0;
  let passParams = `adults=${adults}`;
  if (children > 0) passParams += `&children=${children}`;

  if (p.returnDate) {
    return `https://www.kayak.com/flights/${p.fromCode}-${p.toCode}/${p.departDate}/${p.returnDate}?${passParams}&currency=VND`;
  }
  return `https://www.kayak.com/flights/${p.fromCode}-${p.toCode}/${p.departDate}?${passParams}&currency=VND`;
}

/**
 * Use Google Flights as the primary link. Airline booking flows change often,
 * so an unverified airline deep link must not be presented as reliable.
 */
export function getBestBookingUrl(p: BookingParams): string {
  return buildGoogleFlightsUrl(p);
}

/** Use an affiliate URL only when the server marked it as live and approved. */
export function getEffectiveDealBookingUrl(deal: {
  affiliateUrl?: string;
  affiliateNetwork?: string;
  linkKind?: string;
  bookingUrl?: string;
}, fallback: string): string {
  if (deal.linkKind === "live_affiliate" && deal.affiliateNetwork && deal.affiliateUrl) {
    return deal.affiliateUrl;
  }
  return deal.bookingUrl || fallback;
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
