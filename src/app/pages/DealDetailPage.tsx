import { useParams, Link } from "react-router";
import {
  Plane,
  ChevronLeft,
  Clock,
  Users,
  Zap,
  TrendingDown,
  ExternalLink,
  Share2,
  Bell,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { mockDeals, formatVND, Deal } from "../data/mockDeals";
import { AIInsightPanel } from "../components/AIInsightPanel";
import { HiddenCostAnalyzer } from "../components/HiddenCostAnalyzer";
import { PriceHistoryChart } from "../components/PriceHistoryChart";
import { DealCard } from "../components/DealCard";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Build a direct deep-link to the airline's official booking page
 * with origin, destination and departure date pre-filled.
 * Falls back to Skyscanner one-way search when no verified deep-link exists.
 */
function getBookingUrl(deal: Deal): string {
  const d = new Date(deal.departDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const f = deal.fromCode;
  const t = deal.toCode;

  const YYYYMMDD   = `${yyyy}${mm}${dd}`;
  const ISO        = `${yyyy}-${mm}-${dd}`;        // YYYY-MM-DD
  const DDMMYYYY   = `${dd}/${mm}/${yyyy}`;         // DD/MM/YYYY
  const ddmmyy     = `${dd}${mm}${String(yyyy).slice(2)}`; // Skyscanner DDMMYY

  switch (deal.airlineCode) {
    /* ── Vietnamese carriers ────────────────────────────── */
    case "VN": // Vietnam Airlines
      return `https://www.vietnamairlines.com/vn/vi/book-flight?orgCity=${f}&dstCity=${t}&departureDate=${ISO}&tripType=ow&adult=1`;
    case "VJ": // VietJet Air
      return `https://www.vietjetair.com/Sites/Web/vi-VN/BookingTicket?fromStation=${f}&toStation=${t}&departDate=${DDMMYYYY}&tripType=1&adt=1`;
    case "QH": // Bamboo Airways
      return `https://www.bambooairways.com/vn/vi/booking?routeType=OW&from=${f}&to=${t}&departDate=${DDMMYYYY}&adt=1`;

    /* ── Northeast Asian carriers ───────────────────────── */
    case "KE": // Korean Air
      return `https://www.koreanair.com/booking/booking-gate?selectionType=OW&departureCity=${f}&arrivalCity=${t}&departureDate=${YYYYMMDD}&cabin=Y&adultCount=1`;
    case "CI": // China Airlines
      return `https://www.china-airlines.com/en/purchase/booking/flight-result?origin=${f}&destination=${t}&departureDate=${ISO}&tripType=OW&adults=1`;
    case "MU": // China Eastern
      return `https://www.ceair.com/en/flightList/flightList.html?depCode=${f}&arrCode=${t}&cabinType=Y&tripType=1&dep=${YYYYMMDD}&adult=1`;
    case "CZ": // China Southern
      return `https://www.csair.com/en/buy/air/ticketbooking/flightShopping.shtml?fromCity=${f}&toCity=${t}&fromDate=${YYYYMMDD}&tripType=OW&adults=1`;
    case "CX": // Cathay Pacific
      return `https://www.cathaypacific.com/cx/en_VN.html#/flightSearch?origin=${f}&destination=${t}&departureDate=${YYYYMMDD}&trip=one-way&adult=1`;

    /* ── Southeast Asian / LCC ──────────────────────────── */
    case "TR": // Scoot
      return `https://www.flyscoot.com/en/book/book-a-flight?originStation=${f}&destinationStation=${t}&departureDate=${ISO}&numAdults=1&numChildren=0`;
    case "AK": // AirAsia
      return `https://flights.airasia.com/tsp/flightsearch/route?origin=${f}&destination=${t}&departureDate=${ISO}&tripType=O&adults=1&children=0&infants=0`;
    case "OD": // Batik Air Malaysia (formerly Malindo)
      return `https://www.batikair.com/en/book-a-flight?origin=${f}&destination=${t}&departDate=${ISO}&type=OW&adult=1`;

    /* ── Additional Asian carriers ──────────────────────── */
    case "5J": // Cebu Pacific
      return `https://www.cebupacificair.com/en-ph/book/flights?origin=${f}&destination=${t}&departureDate=${ISO}&tripType=OW&adults=1`;
    case "FD": // Thai AirAsia
      return `https://flights.airasia.com/tsp/flightsearch/route?origin=${f}&destination=${t}&departureDate=${ISO}&tripType=O&adults=1&children=0&infants=0`;
    case "NH": // ANA (All Nippon Airways)
      return `https://www.ana.co.jp/en/jp/book-plan/search/international/?origin=${f}&destination=${t}&departureDate=${YYYYMMDD}&tripType=OW&cabin=Y&adult=1`;
    case "BR": // EVA Air
      return `https://www.evaair.com/en-global/booking/fare-search/?origin=${f}&destination=${t}&departureDate=${ISO}&tripType=OW&adults=1`;
    case "K6": // Cambodia Angkor Air
      return `https://www.cambodiaangkorair.com/en/booking?from=${f}&to=${t}&departDate=${ISO}&tripType=OW&adults=1`;
    case "LJ": // Jin Air
      return `https://www.jinair.com/booking/international?origin=${f}&destination=${t}&departureDate=${YYYYMMDD}&tripType=OW&adult=1`;

    /* ── Middle Eastern carriers ────────────────────────── */
    case "EK": // Emirates
      return `https://www.emirates.com/vn/english/booking/flight_search/?journeyType=ONE_WAY&from=${f}&to=${t}&departureDate=${ISO}&adults=1`;
    case "QR": // Qatar Airways
      return `https://www.qatarairways.com/en/booking/flight-search.html#/search?adults=1&children=0&infants=0&journeyType=O&cabinPreference=Economy&fromStation=${f}&toStation=${t}&departureDate=${ISO}`;
    case "TK": // Turkish Airlines
      return `https://www.turkishairlines.com/en-vn/flights/find-flights/?from=${f}&to=${t}&day=${dd}&month=${mm}&year=${yyyy}&tripType=ONE_WAY&type=one&adults=1`;

    /* ── European carriers ──────────────────────────────── */
    case "AF": // Air France
      return `https://wwws.airfrance.vn/cgi-bin/cgir?applicationCode=AF&departure_date=${dd}${mm}${yyyy}&passenger_count_adult=1&roundtrip=one_way&origin=${f}&destination=${t}`;
    case "KL": // KLM
      return `https://www.klm.com/search/offers?tripType=O&origin=${f}&destination=${t}&outboundDate=${ISO}&adults=1`;

    /* ── Oceanian carriers ──────────────────────────────── */
    case "QF": // Qantas
      return `https://www.qantas.com/au/en/book-a-trip/flights.html?origin=${f}&destination=${t}&departureDate=${ISO}&numberOfAdults=1&tripType=one-way`;

    /* ── African carriers ───────────────────────────────── */
    case "ET": // Ethiopian Airlines
      return `https://www.ethiopianairlines.com/en/book/flight-list?tripType=O&depart_city=${f}&destination_city=${t}&depart_date=${mm}/${dd}/${yyyy}&adult=1`;

    /* ── Default: Skyscanner one-way with airline hint ──── */
    default:
      return `https://www.skyscanner.com.vn/transport/flights/${f.toLowerCase()}/${t.toLowerCase()}/${ddmmyy}/?adultsv2=1&rtn=0&preferdirects=false`;
  }
}

export function DealDetailPage() {
  const { id } = useParams();
  const deal = mockDeals.find((d) => d.id === id);

  if (!deal) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center text-center">
        <div>
          <Plane className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-white mb-2" style={{ fontWeight: 700 }}>Deal không tìm thấy</h1>
          <p className="text-slate-500 mb-6">Deal này có thể đã hết hạn hoặc không tồn tại.</p>
          <Link to="/deals" className="px-6 py-3 bg-sky-500 text-white rounded-xl" style={{ fontWeight: 600 }}>
            Xem Deal Khác
          </Link>
        </div>
      </div>
    );
  }

  const savings = deal.normalPrice - deal.price;
  // Ưu tiên hiện deal cùng region, sau đó fallback sang deal khác
  const otherDeals = [
    ...mockDeals.filter((d) => d.id !== deal.id && d.region === deal.region),
    ...mockDeals.filter((d) => d.id !== deal.id && d.region !== deal.region),
  ].slice(0, 3);

  return (
    <div className="pt-20 pb-16">
      {/* Hero image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src={deal.image} alt={deal.to} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between">
          <Link
            to="/deals"
            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/10 text-white rounded-xl text-sm transition-colors hover:bg-black/60"
            style={{ fontWeight: 600 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm border border-white/10 text-white rounded-xl text-sm hover:bg-black/60">
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              to="/alerts"
              className="flex items-center gap-2 px-4 py-2 bg-sky-500/90 backdrop-blur-sm text-white rounded-xl text-sm"
              style={{ fontWeight: 600 }}
            >
              <Bell className="w-4 h-4" />
              Alert deal tương tự
            </Link>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {deal.isFlashDeal && (
              <span className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-xs rounded-full" style={{ fontWeight: 700 }}>
                <Zap className="w-3 h-3" />FLASH DEAL
              </span>
            )}
            {deal.isTrending && (
              <span className="flex items-center gap-1 px-3 py-1 bg-violet-500/90 text-white text-xs rounded-full" style={{ fontWeight: 600 }}>
                <TrendingDown className="w-3 h-3" />TRENDING
              </span>
            )}
            <span className="px-3 py-1 bg-black/40 backdrop-blur-sm text-slate-300 text-xs rounded-full border border-white/10">
              {deal.tripType === "international" ? "Quốc tế" : "Nội địa"}
            </span>
          </div>

          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-slate-300 text-sm">{deal.fromCode}</span>
                <Plane className="w-4 h-4 text-sky-400" />
                <span className="text-white" style={{ fontWeight: 800, fontSize: "1.5rem" }}>{deal.to}</span>
                <span className="text-slate-300 text-sm">{deal.toCode}</span>
              </div>
              <div className="text-slate-400 text-sm">
                {deal.from} → {deal.country} · {deal.airline}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-sm line-through">{formatVND(deal.normalPrice)}</div>
              <div className="text-emerald-400" style={{ fontWeight: 900, fontSize: "2.25rem", letterSpacing: "-0.04em" }}>
                {formatVND(deal.price)}
              </div>
              <div className="text-emerald-500 text-sm" style={{ fontWeight: 700 }}>
                Tiết kiệm {formatVND(savings)} ({deal.discount}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight info card */}
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-6">
              <h2 className="text-white mb-5" style={{ fontWeight: 700 }}>Thông tin chuyến bay</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Ngày đi", value: formatDate(deal.departDate) },
                  { label: "Ngày về", value: formatDate(deal.returnDate) },
                  { label: "Thời gian bay", value: deal.duration },
                  { label: "Điểm dừng", value: deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm${deal.stopCity ? ` (${deal.stopCity})` : ""}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-slate-500 text-xs mb-1">{label}</div>
                    <div className="text-white text-sm" style={{ fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Route visualization */}
              <div className="flex items-center gap-3 bg-slate-800/30 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-white" style={{ fontWeight: 800, fontSize: "1.25rem" }}>{deal.fromCode}</div>
                  <div className="text-slate-500 text-xs">{deal.from}</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-700" />
                  <div className="flex flex-col items-center">
                    <Plane className="w-5 h-5 text-sky-400" />
                    <span className="text-slate-600 text-xs mt-1">{deal.duration}</span>
                    {deal.stops > 0 && deal.stopCity && (
                      <span className="text-amber-400 text-xs mt-0.5">via {deal.stopCity}</span>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-slate-700" />
                </div>
                <div className="text-center">
                  <div className="text-white" style={{ fontWeight: 800, fontSize: "1.25rem" }}>{deal.toCode}</div>
                  <div className="text-slate-500 text-xs">{deal.to}</div>
                </div>
              </div>

              {/* Urgency */}
              <div className="flex items-center justify-between mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm" style={{ fontWeight: 600 }}>
                    Deal hết hạn trong {deal.expiresIn}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                  <Users className="w-4 h-4" />
                  Còn {deal.seatsLeft} ghế
                </div>
              </div>
            </div>

            {/* Price history */}
            <PriceHistoryChart
              data={deal.priceHistory}
              currentPrice={deal.price}
              normalPrice={deal.normalPrice}
            />

            {/* Hidden costs */}
            <HiddenCostAnalyzer deal={deal} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* CTA card */}
            <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-slate-500 text-xs line-through">{formatVND(deal.normalPrice)}</div>
                  <div className="text-emerald-400" style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
                    {formatVND(deal.price)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-white text-xs text-center leading-tight" style={{ fontWeight: 800 }}>
                    -{deal.discount}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 text-xs leading-relaxed">
                  Chi phí thực tế: {formatVND(deal.realTotal)} (sau phí hành lý)
                </span>
              </div>

              <a
                href={getBookingUrl(deal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-sky-500/30 mb-3"
                style={{ fontWeight: 700, fontSize: "1rem" }}
              >
                <ExternalLink className="w-5 h-5" />
                Đặt Vé Ngay · {deal.airline}
              </a>

              <Link
                to="/alerts"
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Bell className="w-4 h-4" />
                Alert deal tương tự
              </Link>

              <p className="text-slate-600 text-xs text-center mt-3">
                FlyCheap AI chuyển hướng đến trang đặt vé chính thức
              </p>
            </div>

            {/* AI insight */}
            <AIInsightPanel deal={deal} />
          </div>
        </div>

        {/* Similar deals */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white" style={{ fontWeight: 700, fontSize: "1.25rem" }}>Deal Tương Tự</h2>
            <Link
              to="/deals"
              className="flex items-center gap-1 text-sky-400 text-sm hover:text-sky-300 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherDeals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}