/**
 * Canonical Travel Entity Catalog and Resolution Engine
 * Maps user search queries, city names (with/without Vietnamese diacritics),
 * airport names and IATA codes to authoritative travel entity identities.
 */

export interface CanonicalTravelEntity {
  code: string;
  name: string;
  country: string;
  region: "domestic" | "asia" | "europe" | "americas" | "oceania" | "middle_east" | "africa";
  airportName?: string;
  aliases: string[];
}

export const CANONICAL_TRAVEL_ENTITIES: CanonicalTravelEntity[] = [
  // Vietnam Domestic
  {
    code: "HAN",
    name: "Hà Nội",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Nội Bài",
    aliases: ["hanoi", "ha noi", "noi bai", "noibai", "han"],
  },
  {
    code: "SGN",
    name: "TP. Hồ Chí Minh",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Tân Sơn Nhất",
    aliases: ["ho chi minh", "hcm", "saigon", "sai gon", "tan son nhat", "sgn"],
  },
  {
    code: "DAD",
    name: "Đà Nẵng",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Đà Nẵng",
    aliases: ["da nang", "danang", "dad"],
  },
  {
    code: "PQC",
    name: "Phú Quốc",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Phú Quốc",
    aliases: ["phu quoc", "phuquoc", "duong dong", "pqc"],
  },
  {
    code: "CXR",
    name: "Nha Trang",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Cam Ranh",
    aliases: ["nha trang", "cam ranh", "camranh", "cxr"],
  },
  {
    code: "HPH",
    name: "Hải Phòng",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Cát Bi",
    aliases: ["hai phong", "cat bi", "catbi", "hph"],
  },
  {
    code: "VII",
    name: "Vinh",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Vinh",
    aliases: ["vinh", "nghe an", "vii"],
  },
  {
    code: "VCA",
    name: "Cần Thơ",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Quốc tế Cần Thơ",
    aliases: ["can tho", "cantho", "tra noc", "vca"],
  },
  {
    code: "DLI",
    name: "Đà Lạt",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Liên Khương",
    aliases: ["da lat", "dalat", "lien khuong", "dli"],
  },
  {
    code: "UIH",
    name: "Quy Nhơn",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Phù Cát",
    aliases: ["quy nhon", "quynhon", "phu cat", "uih"],
  },
  {
    code: "THD",
    name: "Thanh Hóa",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Thọ Xuân",
    aliases: ["thanh hoa", "thanhhoa", "tho xuan", "thd"],
  },
  {
    code: "BMV",
    name: "Buôn Ma Thuột",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Buôn Ma Thuột",
    aliases: ["buon ma thuot", "dak lak", "bmv"],
  },
  {
    code: "PXU",
    name: "Pleiku",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Pleiku",
    aliases: ["pleiku", "gia lai", "pxu"],
  },
  {
    code: "VDH",
    name: "Đồng Hới",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Đồng Hới",
    aliases: ["dong hoi", "quang binh", "vdh"],
  },
  {
    code: "TBB",
    name: "Tuy Hòa",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Tuy Hòa",
    aliases: ["tuy hoa", "phu yen", "tbb"],
  },
  {
    code: "VCL",
    name: "Chu Lai",
    country: "Việt Nam",
    region: "domestic",
    airportName: "Sân bay Chu Lai",
    aliases: ["chu lai", "quang nam", "vcl"],
  },

  // Asia International
  {
    code: "BKK",
    name: "Bangkok",
    country: "Thái Lan",
    region: "asia",
    airportName: "Suvarnabhumi Airport",
    aliases: ["bangkok", "thai lan", "thailand", "suvarnabhumi", "don mueang", "bkk"],
  },
  {
    code: "SIN",
    name: "Singapore",
    country: "Singapore",
    region: "asia",
    airportName: "Changi Airport",
    aliases: ["singapore", "sing", "changi", "sin"],
  },
  {
    code: "ICN",
    name: "Seoul",
    country: "Hàn Quốc",
    region: "asia",
    airportName: "Incheon International Airport",
    aliases: ["seoul", "han quoc", "korea", "south korea", "incheon", "icn"],
  },
  {
    code: "KUL",
    name: "Kuala Lumpur",
    country: "Malaysia",
    region: "asia",
    airportName: "Kuala Lumpur International Airport",
    aliases: ["kuala lumpur", "malaysia", "klia", "kul"],
  },
  {
    code: "TPE",
    name: "Đài Bắc",
    country: "Đài Loan",
    region: "asia",
    airportName: "Taoyuan International Airport",
    aliases: ["dai bac", "taipei", "taiwan", "dai loan", "taoyuan", "tpe"],
  },
  {
    code: "HKG",
    name: "Hồng Kông",
    country: "Hồng Kông",
    region: "asia",
    airportName: "Hong Kong International Airport",
    aliases: ["hong kong", "hongkong", "hkg", "chek lap kok"],
  },
  {
    code: "NRT",
    name: "Tokyo",
    country: "Nhật Bản",
    region: "asia",
    airportName: "Narita International Airport",
    aliases: ["tokyo", "nhat ban", "japan", "narita", "haneda", "nrt", "hnd"],
  },
  {
    code: "KIX",
    name: "Osaka",
    country: "Nhật Bản",
    region: "asia",
    airportName: "Kansai International Airport",
    aliases: ["osaka", "kansai", "kix"],
  },
  {
    code: "DMK",
    name: "Bangkok (Don Mueang)",
    country: "Thái Lan",
    region: "asia",
    airportName: "Don Mueang International Airport",
    aliases: ["don mueang", "don muang", "dmk"],
  },
  {
    code: "HKT",
    name: "Phuket",
    country: "Thái Lan",
    region: "asia",
    airportName: "Phuket International Airport",
    aliases: ["phuket", "hkt"],
  },
  {
    code: "CNX",
    name: "Chiang Mai",
    country: "Thái Lan",
    region: "asia",
    airportName: "Chiang Mai International Airport",
    aliases: ["chiang mai", "chiangmai", "cnx"],
  },
  {
    code: "DPS",
    name: "Bali",
    country: "Indonesia",
    region: "asia",
    airportName: "Ngurah Rai International Airport",
    aliases: ["bali", "denpasar", "indonesia", "dps"],
  },
  {
    code: "MNL",
    name: "Manila",
    country: "Philippines",
    region: "asia",
    airportName: "Ninoy Aquino International Airport",
    aliases: ["manila", "philippines", "mnl"],
  },
  {
    code: "LHR",
    name: "London",
    country: "Anh",
    region: "europe",
    airportName: "Heathrow Airport",
    aliases: ["london", "anh", "uk", "heathrow", "lhr"],
  },
  {
    code: "FRA",
    name: "Frankfurt",
    country: "Đức",
    region: "europe",
    airportName: "Frankfurt Airport",
    aliases: ["frankfurt", "duc", "germany", "fra"],
  },

  // Oceania
  {
    code: "SYD",
    name: "Sydney",
    country: "Úc",
    region: "oceania",
    airportName: "Kingsford Smith Airport",
    aliases: ["sydney", "uc", "australia", "kingsford smith", "syd"],
  },
  {
    code: "MEL",
    name: "Melbourne",
    country: "Úc",
    region: "oceania",
    airportName: "Melbourne Airport",
    aliases: ["melbourne", "tullamarine", "mel"],
  },

  // Middle East
  {
    code: "DXB",
    name: "Dubai",
    country: "UAE",
    region: "middle_east",
    airportName: "Dubai International Airport",
    aliases: ["dubai", "uae", "dxb"],
  },
  {
    code: "DOH",
    name: "Doha",
    country: "Qatar",
    region: "middle_east",
    airportName: "Hamad International Airport",
    aliases: ["doha", "qatar", "hamad", "doh"],
  },

  // Europe
  {
    code: "CDG",
    name: "Paris",
    country: "Pháp",
    region: "europe",
    airportName: "Charles de Gaulle Airport",
    aliases: ["paris", "phap", "france", "charles de gaulle", "cdg"],
  },
  {
    code: "AMS",
    name: "Amsterdam",
    country: "Hà Lan",
    region: "europe",
    airportName: "Schiphol Airport",
    aliases: ["amsterdam", "ha lan", "netherlands", "schiphol", "ams"],
  },
  {
    code: "IST",
    name: "Istanbul",
    country: "Thổ Nhĩ Kỳ",
    region: "europe",
    airportName: "Istanbul Airport",
    aliases: ["istanbul", "tho nhi ky", "turkey", "ist"],
  },
];

function normalizeSearchText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function resolveCanonicalAirportOrCity(query: string | undefined): CanonicalTravelEntity | undefined {
  if (!query) return undefined;
  const raw = query.trim();
  if (!raw) return undefined;

  // 1. Direct IATA code match
  if (/^[A-Za-z]{3}$/.test(raw)) {
    const codeUpper = raw.toUpperCase();
    const found = CANONICAL_TRAVEL_ENTITIES.find((entity) => entity.code === codeUpper);
    if (found) return found;
  }

  // 2. Normalized text match against aliases, name, country, and airport
  const normalized = normalizeSearchText(raw);
  for (const entity of CANONICAL_TRAVEL_ENTITIES) {
    if (normalizeSearchText(entity.name) === normalized) return entity;
    if (normalizeSearchText(entity.code) === normalized) return entity;
    if (normalizeSearchText(entity.country) === normalized) return entity;
    if (entity.aliases.some((alias) => normalizeSearchText(alias) === normalized)) {
      return entity;
    }
  }

  // 3. Substring matching (e.g. "thanh pho ho chi minh" or "bangkok airport")
  for (const entity of CANONICAL_TRAVEL_ENTITIES) {
    if (
      normalized.includes(normalizeSearchText(entity.name)) ||
      normalizeSearchText(entity.name).includes(normalized) ||
      entity.aliases.some((alias) => normalized.includes(normalizeSearchText(alias)))
    ) {
      return entity;
    }
  }

  return undefined;
}
