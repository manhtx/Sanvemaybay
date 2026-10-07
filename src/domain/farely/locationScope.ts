/**
 * Farely Pure Domain Kernel — Location Scope & Catalog
 * REQ-DOM-004, REQ-DOM-005, NC-002, NC-003
 */

export type LocationScopeType = 'EXACT_AIRPORT' | 'METRO' | 'NEARBY_SET';

export interface LocationScope {
  type: LocationScopeType;
  primaryCode: string;
  expandedCodes: string[];
}

export interface AirportInfo {
  code: string;
  name: string;
  cityName: string;
  metroId?: string;
  country: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export interface MetroInfo {
  metroId: string;
  name: string;
  cityName: string;
  country: string;
  airports: string[];
}

// Canonical Metro Mappings
export const METRO_CATALOG: Record<string, MetroInfo> = {
  BKK_METRO: {
    metroId: 'BKK_METRO',
    name: 'Bangkok All Airports',
    cityName: 'Bangkok',
    country: 'TH',
    airports: ['BKK', 'DMK']
  },
  TYO_METRO: {
    metroId: 'TYO_METRO',
    name: 'Tokyo All Airports',
    cityName: 'Tokyo',
    country: 'JP',
    airports: ['HND', 'NRT']
  },
  SEL_METRO: {
    metroId: 'SEL_METRO',
    name: 'Seoul All Airports',
    cityName: 'Seoul',
    country: 'KR',
    airports: ['ICN', 'GMP']
  },
  OSA_METRO: {
    metroId: 'OSA_METRO',
    name: 'Osaka All Airports',
    cityName: 'Osaka',
    country: 'JP',
    airports: ['KIX', 'ITM']
  },
  TPE_METRO: {
    metroId: 'TPE_METRO',
    name: 'Taipei All Airports',
    cityName: 'Taipei',
    country: 'TW',
    airports: ['TPE', 'TSA']
  },
  NYC_METRO: {
    metroId: 'NYC_METRO',
    name: 'New York All Airports',
    cityName: 'New York',
    country: 'US',
    airports: ['JFK', 'EWR', 'LGA']
  },
  LON_METRO: {
    metroId: 'LON_METRO',
    name: 'London All Airports',
    cityName: 'London',
    country: 'GB',
    airports: ['LHR', 'LGW', 'STN', 'LTN']
  },
  PAR_METRO: {
    metroId: 'PAR_METRO',
    name: 'Paris All Airports',
    cityName: 'Paris',
    country: 'FR',
    airports: ['CDG', 'ORY']
  }
};

// Canonical Airport Catalog
export const AIRPORT_CATALOG: Record<string, AirportInfo> = {
  // Vietnam domestic airports
  HAN: { code: 'HAN', name: 'Nội Bài', cityName: 'Hà Nội', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  SGN: { code: 'SGN', name: 'Tân Sơn Nhất', cityName: 'TP. Hồ Chí Minh', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  DAD: { code: 'DAD', name: 'Đà Nẵng', cityName: 'Đà Nẵng', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  CXR: { code: 'CXR', name: 'Cam Ranh', cityName: 'Nha Trang', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  PQC: { code: 'PQC', name: 'Phú Quốc', cityName: 'Phú Quốc', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  HPH: { code: 'HPH', name: 'Cát Bi', cityName: 'Hải Phòng', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VCA: { code: 'VCA', name: 'Cần Thơ', cityName: 'Cần Thơ', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  HUI: { code: 'HUI', name: 'Phú Bài', cityName: 'Huế', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  BMV: { code: 'BMV', name: 'Buôn Ma Thuột', cityName: 'Buôn Ma Thuột', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  UIH: { code: 'UIH', name: 'Phù Cát', cityName: 'Quy Nhơn', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VCL: { code: 'VCL', name: 'Chu Lai', cityName: 'Tam Kỳ', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VII: { code: 'VII', name: 'Vinh', cityName: 'Vinh', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  THD: { code: 'THD', name: 'Thọ Xuân', cityName: 'Thanh Hóa', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  PXU: { code: 'PXU', name: 'Pleiku', cityName: 'Pleiku', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VDO: { code: 'VDO', name: 'Vân Đồn', cityName: 'Quảng Ninh', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VKG: { code: 'VKG', name: 'Rạch Giá', cityName: 'Rạch Giá', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  CAH: { code: 'CAH', name: 'Cà Mau', cityName: 'Cà Mau', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  DIN: { code: 'DIN', name: 'Điện Biên Phủ', cityName: 'Điện Biên', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  TBB: { code: 'TBB', name: 'Tuy Hòa', cityName: 'Tuy Hòa', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VCS: { code: 'VCS', name: 'Côn Đảo', cityName: 'Côn Đảo', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },

  // International destinations
  BKK: { code: 'BKK', name: 'Suvarnabhumi', cityName: 'Bangkok', metroId: 'BKK_METRO', country: 'TH', timezone: 'Asia/Bangkok' },
  DMK: { code: 'DMK', name: 'Don Mueang', cityName: 'Bangkok', metroId: 'BKK_METRO', country: 'TH', timezone: 'Asia/Bangkok' },
  CNX: { code: 'CNX', name: 'Chiang Mai', cityName: 'Chiang Mai', country: 'TH', timezone: 'Asia/Bangkok' },
  HKT: { code: 'HKT', name: 'Phuket', cityName: 'Phuket', country: 'TH', timezone: 'Asia/Bangkok' },
  SIN: { code: 'SIN', name: 'Changi', cityName: 'Singapore', country: 'SG', timezone: 'Asia/Singapore' },
  KUL: { code: 'KUL', name: 'Kuala Lumpur Intl', cityName: 'Kuala Lumpur', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  ICN: { code: 'ICN', name: 'Incheon', cityName: 'Seoul', metroId: 'SEL_METRO', country: 'KR', timezone: 'Asia/Seoul' },
  GMP: { code: 'GMP', name: 'Gimpo', cityName: 'Seoul', metroId: 'SEL_METRO', country: 'KR', timezone: 'Asia/Seoul' },
  PUS: { code: 'PUS', name: 'Gimhae', cityName: 'Busan', country: 'KR', timezone: 'Asia/Seoul' },
  NRT: { code: 'NRT', name: 'Narita', cityName: 'Tokyo', metroId: 'TYO_METRO', country: 'JP', timezone: 'Asia/Tokyo' },
  HND: { code: 'HND', name: 'Haneda', cityName: 'Tokyo', metroId: 'TYO_METRO', country: 'JP', timezone: 'Asia/Tokyo' },
  KIX: { code: 'KIX', name: 'Kansai', cityName: 'Osaka', metroId: 'OSA_METRO', country: 'JP', timezone: 'Asia/Tokyo' },
  ITM: { code: 'ITM', name: 'Itami', cityName: 'Osaka', metroId: 'OSA_METRO', country: 'JP', timezone: 'Asia/Tokyo' },
  FUK: { code: 'FUK', name: 'Fukuoka', cityName: 'Fukuoka', country: 'JP', timezone: 'Asia/Tokyo' },
  TPE: { code: 'TPE', name: 'Taoyuan', cityName: 'Taipei', metroId: 'TPE_METRO', country: 'TW', timezone: 'Asia/Taipei' },
  TSA: { code: 'TSA', name: 'Songshan', cityName: 'Taipei', metroId: 'TPE_METRO', country: 'TW', timezone: 'Asia/Taipei' },
  HKG: { code: 'HKG', name: 'Hong Kong Intl', cityName: 'Hong Kong', country: 'HK', timezone: 'Asia/Hong_Kong' },
  MFM: { code: 'MFM', name: 'Macau Intl', cityName: 'Macau', country: 'MO', timezone: 'Asia/Macau' },
  DPS: { code: 'DPS', name: 'Ngurah Rai', cityName: 'Bali', country: 'ID', timezone: 'Asia/Makassar' },
  CGK: { code: 'CGK', name: 'Soekarno-Hatta', cityName: 'Jakarta', country: 'ID', timezone: 'Asia/Jakarta' },
  MNL: { code: 'MNL', name: 'Ninoy Aquino', cityName: 'Manila', country: 'PH', timezone: 'Asia/Manila' },
  REP: { code: 'REP', name: 'Siem Reap-Angkor', cityName: 'Siem Reap', country: 'KH', timezone: 'Asia/Phnom_Penh' },
  PNH: { code: 'PNH', name: 'Phnom Penh Intl', cityName: 'Phnom Penh', country: 'KH', timezone: 'Asia/Phnom_Penh' },
  VTE: { code: 'VTE', name: 'Wattay', cityName: 'Vientiane', country: 'LA', timezone: 'Asia/Vientiane' },
  LPQ: { code: 'LPQ', name: 'Luang Prabang', cityName: 'Luang Prabang', country: 'LA', timezone: 'Asia/Vientiane' },
  SYD: { code: 'SYD', name: 'Kingsford Smith', cityName: 'Sydney', country: 'AU', timezone: 'Australia/Sydney' },
  MEL: { code: 'MEL', name: 'Melbourne Intl', cityName: 'Melbourne', country: 'AU', timezone: 'Australia/Melbourne' }
};

/**
 * Resolves an airport code or metro query into a canonical LocationScope.
 */
export function resolveLocationScope(codeOrMetro: string, requestedType?: LocationScopeType): LocationScope {
  const upper = codeOrMetro.trim().toUpperCase();

  // Canonical metro resolution
  if (requestedType === 'METRO' || upper.includes('METRO') || upper.endsWith('_ALL')) {
    // Standardize legacy _ALL to _METRO
    const normalizedKey = upper.endsWith('_ALL') ? `${upper.slice(0, -4)}_METRO` : upper;
    const metro = METRO_CATALOG[normalizedKey];
    if (metro) {
      return {
        type: 'METRO',
        primaryCode: metro.metroId,
        expandedCodes: [...metro.airports]
      };
    }
  }

  // Exact airport (NC-002: DMK cannot satisfy exact BKK)
  const airport = AIRPORT_CATALOG[upper];
  if (airport) {
    if (requestedType === 'METRO' && airport.metroId && METRO_CATALOG[airport.metroId]) {
      return {
        type: 'METRO',
        primaryCode: airport.metroId,
        expandedCodes: [...METRO_CATALOG[airport.metroId].airports]
      };
    }
    return {
      type: requestedType || 'EXACT_AIRPORT',
      primaryCode: upper,
      expandedCodes: [upper]
    };
  }

  // Fallback for codes not yet in catalog
  return {
    type: requestedType || 'EXACT_AIRPORT',
    primaryCode: upper,
    expandedCodes: [upper]
  };
}

/**
 * Checks whether an actual flight airport satisfies the required LocationScope.
 * Invariant: DMK satisfies Bangkok Metro, but DMK CANNOT satisfy exact BKK.
 */
export function satisfiesLocationScope(actualAirport: string, scope: LocationScope): boolean {
  const upper = actualAirport.trim().toUpperCase();
  if (scope.type === 'EXACT_AIRPORT') {
    return upper === scope.primaryCode;
  }
  return scope.expandedCodes.includes(upper);
}
