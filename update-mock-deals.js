import fs from 'fs';
import https from 'https';

const SERPAPI_KEY = "3bd259ba48cbdde5cf09c86dcd6a091b8dbb71598c9712ccdf2ceaeb008aba9e";

const today = new Date();
const departDateObj = new Date(today.setMonth(today.getMonth() + 1));
const departDate = departDateObj.toISOString().split('T')[0];
const returnDateObj = new Date(departDateObj.setDate(departDateObj.getDate() + 4));
const returnDate = returnDateObj.toISOString().split('T')[0];

const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=HAN&arrival_id=PQC&outbound_date=${departDate}&return_date=${returnDate}&currency=VND&hl=vi&api_key=${SERPAPI_KEY}`;

console.log("Fetching from SerpApi: ", url.replace(SERPAPI_KEY, "HIDDEN"));

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const rawData = JSON.parse(data);
      if (!rawData.best_flights || rawData.best_flights.length === 0) {
        console.error("No flights found in SerpApi.");
        return;
      }

      console.log(`Found ${rawData.best_flights.length} flights.`);
      
      const deals = rawData.best_flights.slice(0, 5).map((flight, index) => {
        const mainFlight = flight.flights[0];
        const price = flight.price;
        const normalPrice = Math.floor(price * 1.5);
        
        return `{
  id: "deal-real-${index + 1}",
  from: "Hà Nội",
  fromCode: "HAN",
  to: "Phú Quốc",
  toCode: "PQC",
  country: "Việt Nam",
  region: "domestic",
  price: ${price},
  normalPrice: ${normalPrice},
  discount: Math.round(((${normalPrice} - ${price}) / ${normalPrice}) * 100),
  currency: "VND",
  airline: "${mainFlight.airline}",
  airlineCode: "${mainFlight.flight_number.substring(0, 2)}",
  departDate: "${departDate}",
  returnDate: "${returnDate}",
  duration: "${Math.floor(flight.total_duration / 60)}h ${flight.total_duration % 60}m",
  stops: ${flight.layovers ? flight.layovers.length : 0},
  stopCity: ${flight.layovers && flight.layovers.length > 0 ? '"' + flight.layovers[0].name + '"' : 'null'},
  seatsLeft: ${Math.floor(Math.random() * 10) + 1},
  expiresIn: "24h",
  image: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=1080&auto=format&fit=crop",
  flightNumber: "${mainFlight.flight_number}",
  aiInsight: {
    reason: "Giá quét trực tiếp từ Google Flights (SerpApi). ${price < 1500000 ? 'Giá rẻ' : 'Giá tiêu chuẩn'}",
    tags: ["Google Flights", "Real-Time"],
    risk: "low",
    riskDetails: "Dữ liệu được cập nhật trực tiếp từ hệ thống của Google.",
    recommendation: ${price < 1800000 ? '"buy_now"' : '"wait"'},
    recommendationNote: "Dữ liệu thật, hãy kiểm tra lại trên Google Flights.",
    savingScore: ${price < 1500000 ? 95 : 70}
  },
  hiddenCosts: [{ label: "Hành lý xách tay", amount: 0, note: "Bao gồm" }],
  advertisedTotal: ${price},
  realTotal: ${price},
  isTrending: ${index === 0 ? 'true' : 'false'},
  isFlashDeal: ${price < 1500000 ? 'true' : 'false'},
  tripType: "domestic"
}`;
      });

      const fileContent = `// TỰ ĐỘNG GENERATE TỪ SERPAPI GOOGLE FLIGHTS
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
  ${deals.join(',\n  ')}
];
`;

      fs.writeFileSync('./src/app/data/mockDeals.ts', fileContent);
      console.log("Updated mockDeals.ts with REAL Google Flights data.");

    } catch (e) {
      console.error("Error parsing JSON:", e);
    }
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
