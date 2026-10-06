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
  HAN: { code: 'HAN', name: 'Nội Bài', cityName: 'Hà Nội', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  SGN: { code: 'SGN', name: 'Tân Sơn Nhất', cityName: 'TP. Hồ Chí Minh', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  DAD: { code: 'DAD', name: 'Đà Nẵng', cityName: 'Đà Nẵng', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  CXR: { code: 'CXR', name: 'Cam Ranh', cityName: 'Nha Trang', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  PQC: { code: 'PQC', name: 'Phú Quốc', cityName: 'Phú Quốc', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  HPH: { code: 'HPH', name: 'Cát Bi', cityName: 'Hải Phòng', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  VCA: { code: 'VCA', name: 'Cần Thơ', cityName: 'Cần Thơ', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  HUI: { code: 'HUI', name: 'Phú Bài', cityName: 'Huế', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  BKK: { code: 'BKK', name: 'Suvarnabhumi', cityName: 'Bangkok', metroId: 'BKK_METRO', country: 'TH', timezone: 'Asia/Bangkok' },
  DMK: { code: 'DMK', name: 'Don Mueang', cityName: 'Bangkok', metroId: 'BKK_METRO', country: 'TH', timezone: 'Asia/Bangkok' },
  SIN: { code: 'SIN', name: 'Changi', cityName: 'Singapore', country: 'SG', timezone: 'Asia/Singapore' },
  KUL: { code: 'KUL', name: 'Kuala Lumpur Intl', cityName: 'Kuala Lumpur', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  ICN: { code: 'ICN', name: 'Incheon', cityName: 'Seoul', country: 'KR', timezone: 'Asia/Seoul' },
  NRT: { code: 'NRT', name: 'Narita', cityName: 'Tokyo', metroId: 'TYO_METRO', country: 'JP', timezone: 'Asia/Tokyo' },
  HND: { code: 'HND', name: 'Haneda', cityName: 'Tokyo', metroId: 'TYO_METRO', country: 'JP', timezone: 'Asia/Tokyo' },
  TPE: { code: 'TPE', name: 'Taoyuan', cityName: 'Taipei', country: 'TW', timezone: 'Asia/Taipei' }
};

/**
 * Resolves an airport code or metro query into a canonical LocationScope.
 */
export function resolveLocationScope(codeOrMetro: string, requestedType?: LocationScopeType): LocationScope {
  const upper = codeOrMetro.trim().toUpperCase();

  // If explicitly requested as METRO or query matches a known metro
  if (requestedType === 'METRO' || upper.includes('METRO') || upper === 'BKK_ALL' || upper === 'TYO_ALL') {
    if (upper === 'BKK' || upper === 'DMK' || upper === 'BKK_METRO' || upper === 'BKK_ALL') {
      return {
        type: 'METRO',
        primaryCode: 'BKK_METRO',
        expandedCodes: ['BKK', 'DMK']
      };
    }
    if (upper === 'NRT' || upper === 'HND' || upper === 'TYO_METRO' || upper === 'TYO_ALL') {
      return {
        type: 'METRO',
        primaryCode: 'TYO_METRO',
        expandedCodes: ['HND', 'NRT']
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
