// TỰ ĐỘNG GENERATE TỪ SERPAPI GOOGLE FLIGHTS
export interface Deal {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  country: string;
  region: 'domestic' | 'asia' | 'europe' | 'americas' | 'oceania' | 'africa' | 'middle_east';
  price: number;
  normalPrice: number;
  discount: number;
  currency: string;
  airline: string;
  airlineCode: string;
  departDate: string;
  returnDate?: string;
  duration: string;
  stops: number;
  stopCity: string | null;
  seatsLeft: number;
  expiresIn: string;
  image: string;
  flightNumber: string;
  aiInsight: {
    reason: string;
    tags: string[];
    risk: 'low' | 'medium' | 'high';
    riskDetails: string;
    recommendation: 'buy_now' | 'wait' | 'book_alternative';
    recommendationNote: string;
    savingScore: number;
  };
  hiddenCosts: Array<{ label: string; amount: number; note: string }>;
  advertisedTotal: number;
  realTotal: number;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  tripType: 'domestic' | 'international';
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'VND');
}

export function getRecommendationColor(rec: 'buy_now' | 'wait' | 'book_alternative'): string {
  switch (rec) {
    case 'buy_now': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'wait': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'book_alternative': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
}

export function getRecommendationLabel(rec: 'buy_now' | 'wait' | 'book_alternative'): string {
  switch (rec) {
    case 'buy_now': return 'MUA NGAY';
    case 'wait': return 'ĐỢI GIÁ TỐT HƠN';
    case 'book_alternative': return 'TÌM BAY KHÁC';
    default: return 'XEM XÉT THÊM';
  }
}

export const mockDeals: Deal[] = [
  {
  id: "deal-real-1",
  from: "Hà Nội",
  fromCode: "HAN",
  to: "Phú Quốc",
  toCode: "PQC",
  country: "Việt Nam",
  region: "domestic",
  price: 5292400,
  normalPrice: 7938600,
  discount: Math.round(((7938600 - 5292400) / 7938600) * 100),
  currency: "VND",
  airline: "Vietjet",
  airlineCode: "VJ",
  departDate: "2026-05-07",
  returnDate: "2026-05-11",
  duration: "2h 5m",
  stops: 0,
  stopCity: null,
  seatsLeft: 3,
  expiresIn: "24h",
  image: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=1080&auto=format&fit=crop",
  flightNumber: "VJ 453",
  aiInsight: {
    reason: "Giá quét trực tiếp từ Google Flights (SerpApi). Giá tiêu chuẩn",
    tags: ["Google Flights", "Real-Time"],
    risk: "low",
    riskDetails: "Dữ liệu được cập nhật trực tiếp từ hệ thống của Google.",
    recommendation: "wait",
    recommendationNote: "Dữ liệu thật, hãy kiểm tra lại trên Google Flights.",
    savingScore: 70
  },
  hiddenCosts: [{ label: "Hành lý xách tay", amount: 0, note: "Bao gồm" }],
  advertisedTotal: 5292400,
  realTotal: 5292400,
  isTrending: true,
  isFlashDeal: false,
  tripType: "domestic"
},
  {
  id: "deal-real-2",
  from: "Hà Nội",
  fromCode: "HAN",
  to: "Phú Quốc",
  toCode: "PQC",
  country: "Việt Nam",
  region: "domestic",
  price: 5292400,
  normalPrice: 7938600,
  discount: Math.round(((7938600 - 5292400) / 7938600) * 100),
  currency: "VND",
  airline: "Vietjet",
  airlineCode: "VJ",
  departDate: "2026-05-07",
  returnDate: "2026-05-11",
  duration: "2h 5m",
  stops: 0,
  stopCity: null,
  seatsLeft: 4,
  expiresIn: "24h",
  image: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=1080&auto=format&fit=crop",
  flightNumber: "VJ 441",
  aiInsight: {
    reason: "Giá quét trực tiếp từ Google Flights (SerpApi). Giá tiêu chuẩn",
    tags: ["Google Flights", "Real-Time"],
    risk: "low",
    riskDetails: "Dữ liệu được cập nhật trực tiếp từ hệ thống của Google.",
    recommendation: "wait",
    recommendationNote: "Dữ liệu thật, hãy kiểm tra lại trên Google Flights.",
    savingScore: 70
  },
  hiddenCosts: [{ label: "Hành lý xách tay", amount: 0, note: "Bao gồm" }],
  advertisedTotal: 5292400,
  realTotal: 5292400,
  isTrending: false,
  isFlashDeal: false,
  tripType: "domestic"
},
  {
  id: "deal-real-3",
  from: "Hà Nội",
  fromCode: "HAN",
  to: "Phú Quốc",
  toCode: "PQC",
  country: "Việt Nam",
  region: "domestic",
  price: 6256000,
  normalPrice: 9384000,
  discount: Math.round(((9384000 - 6256000) / 9384000) * 100),
  currency: "VND",
  airline: "Vietnam Airlines",
  airlineCode: "VN",
  departDate: "2026-05-07",
  returnDate: "2026-05-11",
  duration: "2h 10m",
  stops: 0,
  stopCity: null,
  seatsLeft: 2,
  expiresIn: "24h",
  image: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=1080&auto=format&fit=crop",
  flightNumber: "VN 1237",
  aiInsight: {
    reason: "Giá quét trực tiếp từ Google Flights (SerpApi). Giá tiêu chuẩn",
    tags: ["Google Flights", "Real-Time"],
    risk: "low",
    riskDetails: "Dữ liệu được cập nhật trực tiếp từ hệ thống của Google.",
    recommendation: "wait",
    recommendationNote: "Dữ liệu thật, hãy kiểm tra lại trên Google Flights.",
    savingScore: 70
  },
  hiddenCosts: [{ label: "Hành lý xách tay", amount: 0, note: "Bao gồm" }],
  advertisedTotal: 6256000,
  realTotal: 6256000,
  isTrending: false,
  isFlashDeal: false,
  tripType: "domestic"
}
];
