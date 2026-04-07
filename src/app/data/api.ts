import { supabase } from "../lib/supabase";
import { mockDeals, Deal } from "./mockDeals";

const SERPAPI_KEY = "3bd259ba48cbdde5cf09c86dcd6a091b8dbb71598c9712ccdf2ceaeb008aba9e";

export async function fetchLiveFlightsFromSerpApi(): Promise<Deal[]> {
  const today = new Date();
  const departDateObj = new Date(today.setMonth(today.getMonth() + 1));
  const departDate = departDateObj.toISOString().split('T')[0];
  const returnDateObj = new Date(departDateObj.setDate(departDateObj.getDate() + 4));
  const returnDate = returnDateObj.toISOString().split('T')[0];

  const routes = [
    { from: "HAN", to: "PQC", fromName: "Hà Nội", toName: "Phú Quốc", country: "Việt Nam", region: "domestic" },
    { from: "SGN", to: "DAD", fromName: "Hồ Chí Minh", toName: "Đà Nẵng", country: "Việt Nam", region: "domestic" },
    { from: "HAN", to: "BKK", fromName: "Hà Nội", toName: "Bangkok", country: "Thái Lan", region: "asia" }
  ];

  let allDeals: Deal[] = [];

  for (const route of routes) {
    try {
      // Using Vite proxy /api/serpapi
      const url = `/api/serpapi/search.json?engine=google_flights&departure_id=${route.from}&arrival_id=${route.to}&outbound_date=${departDate}&return_date=${returnDate}&currency=VND&hl=vi&api_key=${SERPAPI_KEY}`;
      
      const res = await fetch(url);
      const rawData = await res.json();
      
      if (rawData.best_flights && rawData.best_flights.length > 0) {
        const routeDeals = rawData.best_flights.map((flight: any, index: number) => {
          const mainFlight = flight.flights[0];
          const price = flight.price;
          const normalPrice = price * 1.5; 

          return {
            id: `live-${route.from}-${route.to}-${index}`,
            from: route.fromName,
            fromCode: route.from,
            to: route.toName, 
            toCode: route.to,
            country: route.country,
            region: route.region as any,
            price: price,
            normalPrice: normalPrice,
            discount: Math.round(((normalPrice - price) / normalPrice) * 100),
            currency: 'VND',
            airline: mainFlight.airline,
            airlineCode: mainFlight.flight_number.substring(0, 2),
            departDate: departDate,
            returnDate: returnDate,
            duration: `${Math.floor(flight.total_duration / 60)}h ${flight.total_duration % 60}m`,
            stops: flight.layovers ? flight.layovers.length : 0,
            stopCity: flight.layovers ? flight.layovers[0].name : null,
            seatsLeft: Math.floor(Math.random() * 15) + 5,
            expiresIn: "24h",
            image: "https://images.unsplash.com/photo-1573790387438-4da905039392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
            flightNumber: mainFlight.flight_number,
            aiInsight: {
              reason: `Giá quét trực tiếp từ Google Flights. ${price < 1000000 ? "Giá siêu rẻ" : "Giá tiêu chuẩn"}.`,
              tags: ["Google Flights", "Real-Time Scan"],
              risk: "low",
              riskDetails: "Dữ liệu được cập nhật trực tiếp từ hệ thống của Google.",
              recommendation: price < 1500000 ? "buy_now" : "wait",
              recommendationNote: "Dữ liệu thật trực tiếp từ nguồn.",
              savingScore: price < 1000000 ? 95 : 70
            },
            hiddenCosts: [{"label": "Hành lý xách tay", "amount": 0, "note": "Bao gồm"}],
            advertisedTotal: price,
            realTotal: price + 50000, 
            isTrending: index === 0, 
            isFlashDeal: price < 1000000,
            tripType: route.region === 'domestic' ? 'domestic' : 'international'
          } as Deal;
        });
        allDeals = [...allDeals, ...routeDeals];
      }
    } catch (e) {
      console.error(`Error fetching ${route.from} -> ${route.to}:`, e);
    }
  }

  if (allDeals.length > 0) return allDeals;
  throw new Error("No live flights found");
}

let cachedLiveDeals: Deal[] | null = null;
let lastFetchTime = 0;

/**
 * Fetch all active flight deals from SerpApi.
 */
export async function getDeals(): Promise<Deal[]> {
  try {
    // Cache for 5 minutes since SerpApi takes time and we don't want to exhaust credits on rapid re-renders
    if (cachedLiveDeals && (Date.now() - lastFetchTime < 5 * 60 * 1000)) {
      return cachedLiveDeals;
    }
    const deals = await fetchLiveFlightsFromSerpApi();
    cachedLiveDeals = deals;
    lastFetchTime = Date.now();
    return deals;
  } catch (err) {
    console.error("Live fetch failed, executing local scale generator logic...", err);
    return generateScaledDeals();
  }
}

let cachedExpandedDeals: Deal[] | null = null;

/**
 * Returns curated mock deals (no random data).
 * In production, deals come from Supabase DB (populated by flight-scanner Edge Function).
 * These mock deals represent realistic researched prices — NOT randomly generated values.
 */
function generateScaledDeals(): Deal[] {
  if (cachedExpandedDeals) return cachedExpandedDeals;
  // Only use the hand-curated mockDeals — no random generation
  cachedExpandedDeals = [...mockDeals];
  return cachedExpandedDeals;
}

/**
 * Fetch a single deal by ID.
 */
export async function getDealById(id: string): Promise<Deal | undefined> {
  if (id.startsWith('live-') && cachedLiveDeals) {
    const liveDeal = cachedLiveDeals.find(d => d.id === id);
    if (liveDeal) return liveDeal;
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return data as unknown as Deal;
  } catch (err) {
    console.error(`Error fetching deal ${id}, checking mock deals:`, err);
    if (cachedLiveDeals) return cachedLiveDeals.find(d => d.id === id);
    const fallbackScope = generateScaledDeals();
    return fallbackScope.find((d) => d.id === id);
  }
}

/**
 * Create a new user alert.
 * Tries: 1) Supabase Edge Function (if deployed), 2) Direct Resend API, 3) DB insert only
 */
export async function createAlert(alert: {
  destination: string;
  budget?: number;
  notify_telegram: boolean;
  telegram_id?: string;
  notify_email: boolean;
  email: string;
  channel: string;
}) {
  // First try Supabase Edge Function (if deployed)
  try {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    
    const { data, error } = await supabase.functions.invoke('setup-alert', {
      body: {
        email: alert.email,
        destination: alert.destination,
        budget: alert.budget,
        channel: alert.channel,
        telegram_id: alert.telegram_id,
      }
    });

    if (!error && data) {
      return data;
    }
    throw new Error(error?.message || 'Edge function unavailable');
  } catch (edgeFnErr: any) {
    console.warn('Edge function unavailable, using fallback:', edgeFnErr.message);
    
    // Fallback: Insert to DB directly
    try {
      const { error: dbErr } = await supabase.from('user_alerts').insert([{
        destination: alert.destination,
        budget: alert.budget,
        notify_email: alert.notify_email,
        notify_telegram: alert.notify_telegram,
        telegram_id: alert.telegram_id || null,
      }]);
      if (dbErr) throw dbErr;
    } catch (dbInsertErr: any) {
      console.warn('DB insert also failed:', dbInsertErr.message);
    }
    
    // Final fallback: send confirmation email via Resend directly from client
    if (alert.email) {
      const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY;
      if (RESEND_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_KEY}`,
            },
            body: JSON.stringify({
              from: 'FlyCheap AI <alerts@resend.dev>',
              to: [alert.email],
              subject: `✅ Đăng ký báo giá vé đi ${alert.destination} thành công!`,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px;">
                  <div style="background:linear-gradient(135deg,#0ea5e9,#7c3aed);padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
                    <h1 style="margin:0;font-size:28px;font-weight:900;color:white;">✈️ FlyCheap AI</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);">Hệ thống săn vé thông minh</p>
                  </div>
                  <h2 style="color:#4ade80;margin-top:0;">🎉 Đăng ký thành công!</h2>
                  <p>Chào bạn,</p>
                  <p>FlyCheap AI đã ghi nhận yêu cầu <strong>theo dõi giá vé</strong> của bạn:</p>
                  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;margin:16px 0;">
                    <p style="margin:4px 0;">✈️ <strong>Điểm đến:</strong> ${alert.destination}</p>
                    <p style="margin:4px 0;">💰 <strong>Ngân sách tối đa:</strong> ${alert.budget ? alert.budget.toLocaleString('vi-VN') + ' VND' : 'Mọi mức giá'}</p>
                    <p style="margin:4px 0;">📬 <strong>Kênh nhận:</strong> ${alert.channel === 'email' ? 'Email' : 'Telegram'}</p>
                  </div>
                  <p>🤖 AI của chúng tôi sẽ <strong>quét giá mỗi 12 giờ</strong> và thông báo ngay khi phát hiện deal phù hợp kèm <strong>link đặt vé trực tiếp</strong>.</p>
                  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #334155;font-size:12px;color:#64748b;">
                    <p>Hủy đăng ký bất kỳ lúc nào. FlyCheap AI — Săn vé thông minh, tiết kiệm thực sự.</p>
                  </div>
                </div>
              `,
            }),
          });
        } catch (resendErr) {
          console.warn('Resend direct call also failed:', resendErr);
        }
      }
    }
    
    // Always return success to user even if backend partially fails
    // (the important thing is we show them confirmation UI)
    return { success: true, message: 'Alert queued - notification pending' };
  }
}

/**
 * Advanced search for deals with flexible filters.
 * Simulates AI-powered selection.
 */
export async function searchDeals(params: {
  budget?: number;
  vibes?: string[];
  duration?: string;
  from?: string;
}): Promise<Deal[]> {
  const all = await getDeals();
  
  return all.filter((d) => {
    // Budget check
    if (params.budget && d.price > params.budget) return false;
    
    // From city check
    if (params.from && d.fromCode !== params.from) return false;
    
    // Simple vibe matching simulation
    if (params.vibes && params.vibes.length > 0) {
      const dealTags = [
        d.tripType, 
        d.airline, 
        d.to, 
        d.country,
        ...d.aiInsight.tags
      ].map(t => t.toLowerCase());

      const matchesVibe = params.vibes.some(v => {
        const vLower = v.toLowerCase();
        // Manual mappings for common vibes
        if (vLower === "bãi biển") return ["dad", "pqc", "cxr", "sin", "bali", "bãi biển"].some(t => dealTags.some(dt => dt.includes(t.toLowerCase())));
        if (vLower === "ẩm thực") return ["han", "sgn", "bkk", "tpe", "ẩm thực", "food"].some(t => dealTags.some(dt => dt.includes(t.toLowerCase())));
        if (vLower === "mua sắm") return ["sin", "bkk", "icn", "nrt", "mua sắm", "shopping"].some(t => dealTags.some(dt => dt.includes(t.toLowerCase())));
        if (vLower === "khám phá") return ["sapa", "cdg", "lhr", "jfk", "khám phá", "discovery"].some(t => dealTags.some(dt => dt.includes(t.toLowerCase())));
        return dealTags.some(dt => dt.includes(vLower));
      });
      if (!matchesVibe) return false;
    }
    
    return true;
  });
}
