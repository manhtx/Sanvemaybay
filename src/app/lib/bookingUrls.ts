/**
 * Booking URL Generator — FlyCheap AI
 * 
 * RULES:
 * - Traveloka: KHÔNG dùng deep link vì họ dùng internal airport codes riêng
 *   (HAN trong Traveloka = Jakarta Halim, không phải Nội Bài)
 * - Google Flights ?q= format: CONFIRMED WORKING (stable 2025)
 * - Vietnam Airlines / VietJet: direct booking URL khi biết hãng bay
 * - Skyscanner: YYMMDD format, đã xác nhận hoạt động
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
}

/**
 * Converts YYYY-MM-DD → YYMMDD (Skyscanner URL format)
 */
function toSkyDate(date: string): string {
  return date.replace(/-/g, '').slice(2); // "2026-06-22" → "260622"
}

/**
 * Converts YYYY-MM-DD → DD/MM/YYYY (Vietnam Airlines booking format)
 */
function toVNADate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
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
  if (p.returnDate) {
    const ret = toSkyDate(p.returnDate);
    return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/${ret}/?adults=1&cabinclass=economy&currency=vnd`;
  }
  return `https://www.skyscanner.net/transport/flights/${from}/${to}/${dep}/?adults=1&cabinclass=economy&currency=vnd`;
}

/**
 * Vietnam Airlines direct booking
 * URL format verified từ vietnamairlines.com booking flow
 */
export function buildVietnamAirlinesUrl(p: BookingParams): string {
  const tripType = p.returnDate ? 'roundTrip' : 'oneWay';
  const departStr = toVNADate(p.departDate);
  const returnStr = p.returnDate ? toVNADate(p.returnDate) : '';

  const params = new URLSearchParams({
    lang: 'vi',
    originCode: p.fromCode,
    destinationCode: p.toCode,
    departureDate: departStr,
    tripType,
    cabinCode: 'ECO',
    numAdults: '1',
    numChildren: '0',
    numInfants: '0',
  });
  if (returnStr) params.set('returnDate', returnStr);

  return `https://www.vietnamairlines.com/vn/vi/flight-booking/book-flight/search-flight?${params.toString()}`;
}

/**
 * VietJet Air direct booking
 */
export function buildVietJetUrl(p: BookingParams): string {
  const isRound = !!p.returnDate;
  const base = 'https://www.vietjetair.com/vi/pages/booking';
  const params = new URLSearchParams({
    origin: p.fromCode,
    destination: p.toCode,
    departureDate: p.departDate,
    tripType: isRound ? 'R' : 'O',
    adult: '1',
    child: '0',
    infant: '0',
  });
  if (p.returnDate) params.set('returnDate', p.returnDate);
  return `${base}?${params.toString()}`;
}

/**
 * Bamboo Airways direct booking
 */
export function buildBambooUrl(p: BookingParams): string {
  const isRound = !!p.returnDate;
  const params = new URLSearchParams({
    flightType: isRound ? 'roundTrip' : 'oneWay',
    from: p.fromCode,
    to: p.toCode,
    departDate: p.departDate,
    paxAdt: '1',
    paxChd: '0',
    paxInf: '0',
  });
  if (p.returnDate) params.set('returnDate', p.returnDate);
  return `https://www.bambooairways.com/vi-vn/dat-ve?${params.toString()}`;
}

/**
 * Kayak — reliable international aggregator
 */
export function buildKayakUrl(p: BookingParams): string {
  if (p.returnDate) {
    return `https://www.kayak.com/flights/${p.fromCode}-${p.toCode}/${p.departDate}/${p.returnDate}?adults=1&currency=VND`;
  }
  return `https://www.kayak.com/flights/${p.fromCode}-${p.toCode}/${p.departDate}?adults=1&currency=VND`;
}

/**
 * Normalize airline name for lookup
 */
function normalizeAirline(name?: string): string {
  return (name || '').toLowerCase().trim();
}

/**
 * MAIN: Get best primary booking URL based on airline + route type
 * 
 * Logic:
 * - Vietnam Airlines → direct booking (most accurate price)
 * - VietJet Air → direct booking
 * - Bamboo Airways → direct booking  
 * - Others / unknown → Google Flights (confirmed working)
 */
export function getBestBookingUrl(p: BookingParams): string {
  const airline = normalizeAirline(p.airline);

  if (airline.includes('vietnam airlines') || p.airlineCode === 'VN') {
    return buildVietnamAirlinesUrl(p);
  }
  if (airline.includes('vietjet') || p.airlineCode === 'VJ') {
    return buildVietJetUrl(p);
  }
  if (airline.includes('bamboo') || p.airlineCode === 'QH') {
    return buildBambooUrl(p);
  }

  // Default: Google Flights ?q= format (CONFIRMED WORKING)
  return buildGoogleFlightsUrl(p);
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
  const airline = normalizeAirline(p.airline);
  const options = [];

  // 1. Direct airline booking (most accurate, shows real seat availability)
  if (airline.includes('vietnam airlines') || p.airlineCode === 'VN') {
    options.push({
      label: 'Vietnam Airlines',
      url: buildVietnamAirlinesUrl(p),
      icon: '🇻🇳',
      note: 'Đặt thẳng — giá chính xác nhất',
      isPrimary: true,
    });
  }
  if (airline.includes('vietjet') || p.airlineCode === 'VJ') {
    options.push({
      label: 'VietJet Air',
      url: buildVietJetUrl(p),
      icon: '🔴',
      note: 'Đặt thẳng — giá chính xác nhất',
      isPrimary: true,
    });
  }
  if (airline.includes('bamboo') || p.airlineCode === 'QH') {
    options.push({
      label: 'Bamboo Airways',
      url: buildBambooUrl(p),
      icon: '🎋',
      note: 'Đặt thẳng — giá chính xác nhất',
      isPrimary: true,
    });
  }

  // 2. Google Flights — confirmed working with ?q= format
  options.push({
    label: 'Google Flights',
    url: buildGoogleFlightsUrl(p),
    icon: '✈️',
    note: 'So sánh tất cả hãng bay',
    isPrimary: options.length === 0, // primary if no direct airline
  });

  // 3. Skyscanner
  options.push({
    label: 'Skyscanner',
    url: buildSkyscannerUrl(p),
    icon: '🔍',
    note: 'So sánh + lịch giá rẻ theo ngày',
  });

  // 4. Kayak
  options.push({
    label: 'Kayak',
    url: buildKayakUrl(p),
    icon: '🛶',
    note: 'Tìm giá thấp nhất + khách sạn',
  });

  return options;
}
