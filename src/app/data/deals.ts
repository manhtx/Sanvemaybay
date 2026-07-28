export interface Deal {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  country: string;
  region: "domestic" | "asia" | "europe" | "americas" | "oceania" | "africa" | "middle_east";
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
    risk: "low" | "medium" | "high";
    riskDetails: string;
    recommendation: "buy_now" | "wait" | "book_alternative";
    recommendationNote: string;
    savingScore: number;
  };
  hiddenCosts: Array<{ label: string; amount: number; note: string }>;
  advertisedTotal: number;
  realTotal: number;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  tripType: "domestic" | "international";
  confidence?: number;
  dealScore?: number;
  aiReasoning?: string;
  bookingUrl?: string;
  observedAt?: string;
  validUntil?: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export const regionFlag: Record<Deal["region"], string> = {
  domestic: "🇻🇳",
  asia: "🌏",
  europe: "🇪🇺",
  americas: "🌎",
  oceania: "🦘",
  africa: "🌍",
  middle_east: "🕌",
};

export function getRiskColor(risk: Deal["aiInsight"]["risk"]): string {
  return {
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-red-400",
  }[risk];
}

export function getRiskBg(risk: Deal["aiInsight"]["risk"]): string {
  return {
    low: "bg-emerald-500/10 border-emerald-500/20",
    medium: "bg-amber-500/10 border-amber-500/20",
    high: "bg-red-500/10 border-red-500/20",
  }[risk];
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount).replace("₫", "VND");
}

export function getRecommendationColor(
  recommendation: Deal["aiInsight"]["recommendation"],
): string {
  switch (recommendation) {
    case "buy_now":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "wait":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "book_alternative":
      return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
  }
}

export function getRecommendationLabel(
  recommendation: Deal["aiInsight"]["recommendation"],
): string {
  switch (recommendation) {
    case "buy_now":
      return "MUA NGAY";
    case "wait":
      return "ĐỢI GIÁ TỐT HƠN";
    case "book_alternative":
      return "TÌM BAY KHÁC";
  }
}
