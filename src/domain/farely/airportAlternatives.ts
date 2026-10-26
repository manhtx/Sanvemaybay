/**
 * Farely Pure Domain Kernel — Airport Alternatives & Local Datetime Correctness
 * F23: Airport alternatives with grounded ground transfer time/cost
 * F68: Airport and local datetime correctness across timezones and overnight transitions
 * REQ-DOM-004, REQ-DOM-005, NC-002, NC-003
 */

import { AIRPORT_CATALOG, type AirportInfo } from './locationScope.ts';

export interface GroundTransferRoute {
  originCode: string;
  destinationCode: string;
  distanceKm: number;
  typicalMinutes: number;
  estimatedCostVND: number;
  modes: string[];
  sourceName: string;
  isVerifiedSource: boolean;
}

// Canonical Ground Transfer Catalog
export const GROUND_TRANSFER_CATALOG: GroundTransferRoute[] = [
  // Bangkok Metro: BKK <-> DMK
  {
    originCode: 'BKK',
    destinationCode: 'DMK',
    distanceKm: 47,
    typicalMinutes: 60,
    estimatedCostVND: 200000,
    modes: ['AOT Shuttle miễn phí (có vé bay)', 'Taxi cao tốc Chaloem Maha Nakhon'],
    sourceName: 'Bangkok Expressway and Metro Authority (BEM) & AOT Transfer Policy',
    isVerifiedSource: true,
  },
  {
    originCode: 'DMK',
    destinationCode: 'BKK',
    distanceKm: 47,
    typicalMinutes: 60,
    estimatedCostVND: 200000,
    modes: ['AOT Shuttle miễn phí (có vé bay)', 'Taxi cao tốc Chaloem Maha Nakhon'],
    sourceName: 'Bangkok Expressway and Metro Authority (BEM) & AOT Transfer Policy',
    isVerifiedSource: true,
  },
  // Tokyo Metro: HND <-> NRT
  {
    originCode: 'HND',
    destinationCode: 'NRT',
    distanceKm: 75,
    typicalMinutes: 85,
    estimatedCostVND: 580000,
    modes: ['Keisei Skyliner + Toei Asakusa Line', 'Airport Limousine Bus trực tiếp'],
    sourceName: 'Keisei Electric Railway & Tokyo Airport Transport Service tariff',
    isVerifiedSource: true,
  },
  {
    originCode: 'NRT',
    destinationCode: 'HND',
    distanceKm: 75,
    typicalMinutes: 85,
    estimatedCostVND: 580000,
    modes: ['Keisei Skyliner + Toei Asakusa Line', 'Airport Limousine Bus trực tiếp'],
    sourceName: 'Keisei Electric Railway & Tokyo Airport Transport Service tariff',
    isVerifiedSource: true,
  },
  // Seoul Metro: ICN <-> GMP
  {
    originCode: 'ICN',
    destinationCode: 'GMP',
    distanceKm: 38,
    typicalMinutes: 40,
    estimatedCostVND: 85000,
    modes: ['Tàu nhanh AREX All-Stop'],
    sourceName: 'Airport Railroad Corporation (AREX) standard fare schedule',
    isVerifiedSource: true,
  },
  {
    originCode: 'GMP',
    destinationCode: 'ICN',
    distanceKm: 38,
    typicalMinutes: 40,
    estimatedCostVND: 85000,
    modes: ['Tàu nhanh AREX All-Stop'],
    sourceName: 'Airport Railroad Corporation (AREX) standard fare schedule',
    isVerifiedSource: true,
  },
  // Osaka Metro: KIX <-> ITM
  {
    originCode: 'KIX',
    destinationCode: 'ITM',
    distanceKm: 70,
    typicalMinutes: 75,
    estimatedCostVND: 350000,
    modes: ['Kansai Airport Limousine Bus'],
    sourceName: 'Kansai Airport Transportation Enterprise official tariff',
    isVerifiedSource: true,
  },
  {
    originCode: 'ITM',
    destinationCode: 'KIX',
    distanceKm: 70,
    typicalMinutes: 75,
    estimatedCostVND: 350000,
    modes: ['Kansai Airport Limousine Bus'],
    sourceName: 'Kansai Airport Transportation Enterprise official tariff',
    isVerifiedSource: true,
  },
  // Taipei Metro: TPE <-> TSA
  {
    originCode: 'TPE',
    destinationCode: 'TSA',
    distanceKm: 45,
    typicalMinutes: 50,
    estimatedCostVND: 130000,
    modes: ['Taoyuan Airport MRT Express + Tuyến MRT Đài Bắc'],
    sourceName: 'Taoyuan Metro Corporation tariff schedule',
    isVerifiedSource: true,
  },
  {
    originCode: 'TSA',
    destinationCode: 'TPE',
    distanceKm: 45,
    typicalMinutes: 50,
    estimatedCostVND: 130000,
    modes: ['Taoyuan Airport MRT Express + Tuyến MRT Đài Bắc'],
    sourceName: 'Taoyuan Metro Corporation tariff schedule',
    isVerifiedSource: true,
  },
  // Adjacent Vietnam regional airports: HAN <-> HPH
  {
    originCode: 'HAN',
    destinationCode: 'HPH',
    distanceKm: 120,
    typicalMinutes: 105,
    estimatedCostVND: 220000,
    modes: ['Xe limousine cao tốc Hà Nội - Hải Phòng'],
    sourceName: 'Bảng cước xe khách cao tốc Hà Nội - Hải Phòng công bố',
    isVerifiedSource: true,
  },
  {
    originCode: 'HPH',
    destinationCode: 'HAN',
    distanceKm: 120,
    typicalMinutes: 105,
    estimatedCostVND: 220000,
    modes: ['Xe limousine cao tốc Hà Nội - Hải Phòng'],
    sourceName: 'Bảng cước xe khách cao tốc Hà Nội - Hải Phòng công bố',
    isVerifiedSource: true,
  },
  // Adjacent Vietnam regional airports: SGN <-> VCA
  {
    originCode: 'SGN',
    destinationCode: 'VCA',
    distanceKm: 170,
    typicalMinutes: 180,
    estimatedCostVND: 250000,
    modes: ['Xe limousine cao tốc Trung Lương - Mỹ Thuận'],
    sourceName: 'Bảng cước vận tải hành khách tuyến Sài Gòn - Cần Thơ',
    isVerifiedSource: true,
  },
  {
    originCode: 'VCA',
    destinationCode: 'SGN',
    distanceKm: 170,
    typicalMinutes: 180,
    estimatedCostVND: 250000,
    modes: ['Xe limousine cao tốc Trung Lương - Mỹ Thuận'],
    sourceName: 'Bảng cước vận tải hành khách tuyến Sài Gòn - Cần Thơ',
    isVerifiedSource: true,
  },
];

/**
 * Finds ground transfer information between two airport codes.
 */
export function findGroundTransfer(fromCode: string, toCode: string): GroundTransferRoute | undefined {
  const from = fromCode.trim().toUpperCase();
  const to = toCode.trim().toUpperCase();
  if (from === to) return undefined;

  return GROUND_TRANSFER_CATALOG.find(
    (route) => route.originCode === from && route.destinationCode === to
  );
}

/**
 * Checks if two airports belong to the same metropolitan cluster.
 */
export function areAirportsInSameMetro(codeA: string, codeB: string): { inSameMetro: boolean; metroId?: string } {
  const a = AIRPORT_CATALOG[codeA.trim().toUpperCase()];
  const b = AIRPORT_CATALOG[codeB.trim().toUpperCase()];

  if (a?.metroId && b?.metroId && a.metroId === b.metroId) {
    return { inSameMetro: true, metroId: a.metroId };
  }
  return { inSameMetro: false };
}

/**
 * Timezone-aware flight timing details (F68).
 */
export interface TimezoneAwareFlightTiming {
  departureAirport: AirportInfo;
  arrivalAirport: AirportInfo;
  departureLocal: string;
  arrivalLocal: string;
  departureUtcIso: string;
  arrivalUtcIso: string;
  trueElapsedMinutes: number;
  isOvernight: boolean;
  crossTimezone: boolean;
  timezoneOffsetHours: number;
}

/**
 * Parses local date/time strings with airport timezone to calculate true elapsed flight instants (F68).
 */
export function calculateTimezoneAwareTiming(params: {
  departureCode: string;
  arrivalCode: string;
  departureLocalIso: string; // e.g. "2026-11-01T23:30:00" or "2026-11-01 23:30"
  arrivalLocalIso: string; // e.g. "2026-11-02T06:00:00" or "2026-11-02 06:00"
}): TimezoneAwareFlightTiming {
  const depAirport = AIRPORT_CATALOG[params.departureCode.trim().toUpperCase()];
  const arrAirport = AIRPORT_CATALOG[params.arrivalCode.trim().toUpperCase()];

  if (!depAirport) {
    throw new Error(`Sân bay khởi hành '${params.departureCode}' chưa được đăng ký trong danh mục`);
  }
  if (!arrAirport) {
    throw new Error(`Sân bay đến '${params.arrivalCode}' chưa được đăng ký trong danh mục`);
  }

  // Parse local ISO into year, month, day, hour, minute
  const parseLocalParts = (iso: string) => {
    const cleaned = iso.replace(' ', 'T');
    const [datePart, timePart = '00:00:00'] = cleaned.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second = 0] = timePart.split(':').map(Number);
    return { year, month: month - 1, day, hour, minute, second };
  };

  const depParts = parseLocalParts(params.departureLocalIso);
  const arrParts = parseLocalParts(params.arrivalLocalIso);

  // Approximate UTC conversion using Intl timezone offset lookup
  const getOffsetMinutes = (timezone: string, date: Date): number => {
    try {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
    } catch {
      // Fallback: standard Vietnam UTC+7
      return 420;
    }
  };

  const depRef = new Date(Date.UTC(depParts.year, depParts.month, depParts.day, depParts.hour, depParts.minute, depParts.second));
  const depOffsetMinutes = getOffsetMinutes(depAirport.timezone, depRef);
  const depUtcTime = depRef.getTime() - depOffsetMinutes * 60000;

  const arrRef = new Date(Date.UTC(arrParts.year, arrParts.month, arrParts.day, arrParts.hour, arrParts.minute, arrParts.second));
  const arrOffsetMinutes = getOffsetMinutes(arrAirport.timezone, arrRef);
  const arrUtcTime = arrRef.getTime() - arrOffsetMinutes * 60000;

  const trueElapsedMinutes = Math.round((arrUtcTime - depUtcTime) / 60000);
  const crossTimezone = depAirport.timezone !== arrAirport.timezone;
  const timezoneOffsetHours = Math.round((arrOffsetMinutes - depOffsetMinutes) / 60);

  const depDayStr = `${depParts.year}-${String(depParts.month + 1).padStart(2, '0')}-${String(depParts.day).padStart(2, '0')}`;
  const arrDayStr = `${arrParts.year}-${String(arrParts.month + 1).padStart(2, '0')}-${String(arrParts.day).padStart(2, '0')}`;
  const isOvernight = arrDayStr > depDayStr;

  return {
    departureAirport: depAirport,
    arrivalAirport: arrAirport,
    departureLocal: params.departureLocalIso,
    arrivalLocal: params.arrivalLocalIso,
    departureUtcIso: new Date(depUtcTime).toISOString(),
    arrivalUtcIso: new Date(arrUtcTime).toISOString(),
    trueElapsedMinutes,
    isOvernight,
    crossTimezone,
    timezoneOffsetHours,
  };
}

export type AlternativeVerdict = 'RECOMMENDED' | 'MARGINAL' | 'NOT_RECOMMENDED';

export interface AirportAlternativeEvaluation {
  baselineAirportCode: string;
  baselineAirportName: string;
  baselinePrice: number;
  alternativeAirportCode: string;
  alternativeAirportName: string;
  alternativePrice: number;
  metroId?: string;
  airFareSavingsVND: number;
  groundTransfer: {
    distanceKm: number;
    typicalMinutes: number;
    estimatedCostVND: number;
    sourceName: string;
    isVerifiedSource: boolean;
    modes: string[];
  };
  netSavingsVND: number;
  hourlyEfficiencyVND: number;
  verdict: AlternativeVerdict;
  worthwhile: boolean;
  tradeoffExplanation: string;
}

/**
 * Minimum net savings per hour of transfer inconvenience to consider worthwhile.
 * (e.g. 250,000 VND / hour)
 */
export const MIN_INCONVENIENCE_VALUE_VND_PER_HOUR = 250000;

/**
 * Compares an airport alternative against a baseline airport option (F23 & F68).
 * INVARIANT F23: "Compare grounded air fare savings against travel inconvenience, not price-only airport swaps."
 * Never presents raw air fare savings without factoring in ground transfer costs and travel time.
 */
export function evaluateAirportAlternative(params: {
  baselineAirportCode: string;
  baselinePrice: number;
  alternativeAirportCode: string;
  alternativePrice: number;
}): AirportAlternativeEvaluation {
  const baseCode = (params.baselineAirportCode || "").trim().toUpperCase();
  const altCode = (params.alternativeAirportCode || "").trim().toUpperCase();

  const baseAirport = AIRPORT_CATALOG[baseCode];
  const altAirport = AIRPORT_CATALOG[altCode];

  const baseName = baseAirport?.name || baseCode || "UNKNOWN";
  const altName = altAirport?.name || altCode || "UNKNOWN";

  if (!baseCode || !altCode || baseCode === altCode) {
    return {
      baselineAirportCode: baseCode || "UNKNOWN",
      baselineAirportName: baseName,
      baselinePrice: Number.isFinite(params.baselinePrice) ? params.baselinePrice : 0,
      alternativeAirportCode: altCode || "UNKNOWN",
      alternativeAirportName: altName,
      alternativePrice: Number.isFinite(params.alternativePrice) ? params.alternativePrice : 0,
      airFareSavingsVND: 0,
      groundTransfer: {
        distanceKm: 0,
        typicalMinutes: 0,
        estimatedCostVND: 0,
        modes: [],
        sourceName: "Sân bay trùng khớp hoặc không hợp lệ",
        isVerifiedSource: true,
      },
      netSavingsVND: 0,
      hourlyEfficiencyVND: 0,
      verdict: "NOT_RECOMMENDED",
      worthwhile: false,
      tradeoffExplanation: baseCode === altCode
        ? "Sân bay so sánh trùng khớp với sân bay gốc."
        : "Mã sân bay so sánh không hợp lệ.",
    };
  }

  if (
    !Number.isFinite(params.baselinePrice) ||
    params.baselinePrice <= 0 ||
    !Number.isFinite(params.alternativePrice) ||
    params.alternativePrice <= 0
  ) {
    return {
      baselineAirportCode: baseCode,
      baselineAirportName: baseName,
      baselinePrice: Number.isFinite(params.baselinePrice) ? params.baselinePrice : 0,
      alternativeAirportCode: altCode,
      alternativeAirportName: altName,
      alternativePrice: Number.isFinite(params.alternativePrice) ? params.alternativePrice : 0,
      airFareSavingsVND: 0,
      groundTransfer: {
        distanceKm: 0,
        typicalMinutes: 0,
        estimatedCostVND: 0,
        modes: [],
        sourceName: "Mức giá không hợp lệ",
        isVerifiedSource: true,
      },
      netSavingsVND: 0,
      hourlyEfficiencyVND: 0,
      verdict: "NOT_RECOMMENDED",
      worthwhile: false,
      tradeoffExplanation: "Mức giá so sánh không hợp lệ (phải là số dương hợp lệ).",
    };
  }

  const { inSameMetro, metroId } = areAirportsInSameMetro(baseCode, altCode);

  // Find ground transfer route between the two airports
  let transfer = findGroundTransfer(altCode, baseCode) || findGroundTransfer(baseCode, altCode);

  if (!transfer) {
    // Uncataloged pair fallback: explicitly label as heuristic estimate
    transfer = {
      originCode: altCode,
      destinationCode: baseCode,
      distanceKm: inSameMetro ? 50 : 100,
      typicalMinutes: inSameMetro ? 60 : 120,
      estimatedCostVND: inSameMetro ? 200000 : 400000,
      modes: ['Phương tiện đường bộ / Taxi dự kiến'],
      sourceName: 'Ước tính thuật toán (chưa có dữ liệu bảng cước công bố)',
      isVerifiedSource: false,
    };
  }

  const airFareSavingsVND = params.baselinePrice - params.alternativePrice;
  const netSavingsVND = airFareSavingsVND - transfer.estimatedCostVND;
  const safeMinutes = Number.isFinite(transfer.typicalMinutes) && transfer.typicalMinutes > 0 ? transfer.typicalMinutes : 60;
  const transferHours = Math.max(0.25, safeMinutes / 60);
  const hourlyEfficiencyVND = Math.round(netSavingsVND / transferHours);

  let verdict: AlternativeVerdict;
  let worthwhile: boolean;
  let tradeoffExplanation: string;

  if (netSavingsVND <= 0) {
    verdict = 'NOT_RECOMMENDED';
    worthwhile = false;
    if (airFareSavingsVND > 0) {
      tradeoffExplanation =
        `Giá vé qua ${altName} (${altCode}) thấp hơn ${airFareSavingsVND.toLocaleString('vi-VN')}₫, ` +
        `nhưng chi phí di chuyển đường bộ dự tính (~${transfer.estimatedCostVND.toLocaleString('vi-VN')}₫, ~${transfer.typicalMinutes} phút) ` +
        `làm phát sinh thêm chi phí ròng (${Math.abs(netSavingsVND).toLocaleString('vi-VN')}₫). Không khuyến nghị đổi sân bay.`;
    } else {
      tradeoffExplanation =
        `Giá vé qua ${altName} (${altCode}) đắt hơn chuyến gốc và phát sinh thêm chi phí di chuyển đường bộ. Không khuyến nghị.`;
    }
  } else if (hourlyEfficiencyVND < MIN_INCONVENIENCE_VALUE_VND_PER_HOUR) {
    verdict = 'MARGINAL';
    worthwhile = false;
    tradeoffExplanation =
      `Tiết kiệm thực tế sau khi trừ cước di chuyển chỉ là ${netSavingsVND.toLocaleString('vi-VN')}₫ ` +
      `cho khoảng ${transfer.typicalMinutes} phút di chuyển phát sinh (~${hourlyEfficiencyVND.toLocaleString('vi-VN')}₫/giờ). ` +
      `Mức đánh đổi này không đủ bù đắp sự bất tiện trừ khi bạn có lịch trình linh hoạt.`;
  } else {
    verdict = 'RECOMMENDED';
    worthwhile = true;
    tradeoffExplanation =
      `Tiết kiệm thực tế ${netSavingsVND.toLocaleString('vi-VN')}₫ sau khi đã trừ chi phí di chuyển đường bộ ` +
      `(~${transfer.estimatedCostVND.toLocaleString('vi-VN')}₫, ~${transfer.typicalMinutes} phút). Lựa chọn này rất đáng cân nhắc.`;
  }

  return {
    baselineAirportCode: baseCode,
    baselineAirportName: baseName,
    baselinePrice: params.baselinePrice,
    alternativeAirportCode: altCode,
    alternativeAirportName: altName,
    alternativePrice: params.alternativePrice,
    metroId,
    airFareSavingsVND,
    groundTransfer: {
      distanceKm: transfer.distanceKm,
      typicalMinutes: transfer.typicalMinutes,
      estimatedCostVND: transfer.estimatedCostVND,
      sourceName: transfer.sourceName,
      isVerifiedSource: transfer.isVerifiedSource,
      modes: transfer.modes,
    },
    netSavingsVND,
    hourlyEfficiencyVND,
    verdict,
    worthwhile,
    tradeoffExplanation,
  };
}
