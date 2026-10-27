/**
 * Vietnam-Specific Travel Context & Carrier Policies
 * Satisfies F86 (Vietnam-specific UX) and F87 (Intent-based travel motivations)
 */

export interface VietnamHoliday {
  name: string;
  solarStartDate: string; // YYYY-MM-DD
  solarEndDate: string; // YYYY-MM-DD
  peakDemand: boolean;
  guidanceVi: string;
}

export const VIETNAM_MAJOR_HOLIDAYS_2026: VietnamHoliday[] = [
  {
    name: "Tết Nguyên Đán Bính Ngọ 2026",
    solarStartDate: "2026-02-14",
    solarEndDate: "2026-02-23",
    peakDemand: true,
    guidanceVi: "Cao điểm Tết: Giá vé máy bay chiều về trước Tết và chiều đi sau Tết thường có nhu cầu rất lớn.",
  },
  {
    name: "Giỗ Tổ Hùng Vương 2026",
    solarStartDate: "2026-04-25",
    solarEndDate: "2026-04-27",
    peakDemand: true,
    guidanceVi: "Kỳ nghỉ Giỗ Tổ: Thích hợp cho các chuyến du lịch ngắn ngày 2-3 ngày.",
  },
  {
    name: "Kỳ nghỉ Lễ 30/4 - 1/5 2026",
    solarStartDate: "2026-04-30",
    solarEndDate: "2026-05-03",
    peakDemand: true,
    guidanceVi: "Kỳ nghỉ hè mở màn: Điểm đến biển đảo thường có tỷ lệ lấp đầy ghế cao.",
  },
  {
    name: "Quốc khánh 2/9 2026",
    solarStartDate: "2026-09-01",
    solarEndDate: "2026-09-04",
    peakDemand: true,
    guidanceVi: "Kỳ nghỉ Quốc khánh: Nên theo dõi giá và kích hoạt Watch sớm từ 4-6 tuần.",
  },
];

export interface CarrierBaggagePolicy {
  carrierCode: string;
  carrierName: string;
  standardCarryOnKg: number;
  standardCheckedBagIncluded: boolean;
  defaultCheckedKgIfIncluded: number;
  baggageNoteVi: string;
}

export const VIETNAM_DOMESTIC_CARRIERS: Record<string, CarrierBaggagePolicy> = {
  VN: {
    carrierCode: "VN",
    carrierName: "Vietnam Airlines",
    standardCarryOnKg: 12,
    standardCheckedBagIncluded: true,
    defaultCheckedKgIfIncluded: 23,
    baggageNoteVi: "Đã bao gồm 1 kiện 12kg xách tay và 1 kiện 23kg ký gửi (trừ hạng Siêu tiết kiệm).",
  },
  VJ: {
    carrierCode: "VJ",
    carrierName: "Vietjet Air",
    standardCarryOnKg: 7,
    standardCheckedBagIncluded: false,
    defaultCheckedKgIfIncluded: 0,
    baggageNoteVi: "Vé tiêu chuẩn chỉ gồm 7kg xách tay. Hành lý ký gửi cần mua thêm theo gói.",
  },
  QH: {
    carrierCode: "QH",
    carrierName: "Bamboo Airways",
    standardCarryOnKg: 7,
    standardCheckedBagIncluded: false,
    defaultCheckedKgIfIncluded: 0,
    baggageNoteVi: "Bao gồm 7kg xách tay. Hành lý ký gửi tùy thuộc vào điều kiện từng nhóm giá.",
  },
  VU: {
    carrierCode: "VU",
    carrierName: "Vietravel Airlines",
    standardCarryOnKg: 7,
    standardCheckedBagIncluded: false,
    defaultCheckedKgIfIncluded: 0,
    baggageNoteVi: "Bao gồm 7kg xách tay. Hành lý ký gửi tính phí theo bảng giá hãng.",
  },
};

export const DEFAULT_CARRIER_BAGGAGE_POLICY: Readonly<CarrierBaggagePolicy> = Object.freeze({
  carrierCode: "DEFAULT",
  carrierName: "Hãng chưa cập nhật chính sách riêng",
  standardCarryOnKg: 7,
  standardCheckedBagIncluded: false,
  defaultCheckedKgIfIncluded: 0,
  baggageNoteVi: "Mặc định 7kg xách tay tiêu chuẩn CAAV. Hành lý ký gửi cần xác nhận trực tiếp với hãng vận chuyển.",
});

export type TravelMotivation = "BEACH" | "NATURE_TREKKING" | "CULINARY_CULTURE" | "HERITAGE_HISTORY";

export const MOTIVATION_DESTINATIONS: Record<TravelMotivation, { labelVi: string; destinationCodes: string[] }> = {
  BEACH: {
    labelVi: "Biển nghỉ dưỡng",
    destinationCodes: ["PQC", "CXR", "DAD", "UIH", "VCL", "VCS"],
  },
  NATURE_TREKKING: {
    labelVi: "Thiên nhiên & Núi đồi",
    destinationCodes: ["DLI", "PXU", "BMV", "DIN"],
  },
  CULINARY_CULTURE: {
    labelVi: "Ẩm thực & Đô thị",
    destinationCodes: ["HAN", "SGN", "HPH", "VCA"],
  },
  HERITAGE_HISTORY: {
    labelVi: "Di sản & Lịch sử",
    destinationCodes: ["HUI", "VDH", "THD", "VII"],
  },
};

/**
 * Validates whether a date string is a mathematically valid Gregorian calendar date in YYYY-MM-DD format.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parts = dateStr.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Checks if a given departure date falls within a known major Vietnam holiday period.
 * Sanitizes delimiters, verifies true calendar date, and prevents invalid matches.
 */
export function getVietnamHolidayContext(departDate: string): VietnamHoliday | null {
  if (!departDate || typeof departDate !== "string") return null;
  const cleanDate = departDate.trim().slice(0, 10).replace(/[./]/g, "-");
  if (!isValidCalendarDate(cleanDate)) return null;

  for (const holiday of VIETNAM_MAJOR_HOLIDAYS_2026) {
    if (cleanDate >= holiday.solarStartDate && cleanDate <= holiday.solarEndDate) {
      return holiday;
    }
  }
  return null;
}

/**
 * Retrieves domestic carrier baggage policy by airline code.
 * Defends against non-string inputs and supports transparent fallback.
 */
export function getCarrierBaggagePolicy(
  carrierCode: string,
  fallbackIfUnknown: boolean = false
): CarrierBaggagePolicy | null {
  if (!carrierCode || typeof carrierCode !== "string") {
    return fallbackIfUnknown ? DEFAULT_CARRIER_BAGGAGE_POLICY : null;
  }
  const upper = carrierCode.trim().toUpperCase();
  return VIETNAM_DOMESTIC_CARRIERS[upper] || (fallbackIfUnknown ? DEFAULT_CARRIER_BAGGAGE_POLICY : null);
}

/**
 * Returns list of destinations matching a travel motivation.
 */
export function getDestinationsByMotivation(motivation: TravelMotivation): string[] {
  return MOTIVATION_DESTINATIONS[motivation]?.destinationCodes || [];
}
