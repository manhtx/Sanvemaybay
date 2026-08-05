import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PricePoint } from "../data/deals";
import { buildPriceAnalytics } from "../domain/priceAnalytics";
import { forecastPrice } from "../domain/priceForecast";
import { filterPriceHistoryByDays, PRICE_HISTORY_WINDOWS, PriceHistoryWindow } from "../domain/priceHistoryWindows";
import { useMemo, useState } from "react";

interface PriceHistoryChartProps {
  data: PricePoint[];
  currentPrice: number;
  normalPrice: number;
}

const formatMillion = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${(value / 1000).toFixed(0)}k`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="text-white text-sm" style={{ fontWeight: 700 }}>
          {formatMillion(value)}₫
        </p>
      </div>
    );
  }
  return null;
};

export function PriceHistoryChart({ data, currentPrice, normalPrice }: PriceHistoryChartProps) {
  const [windowDays, setWindowDays] = useState<PriceHistoryWindow>(30);
  const visibleData = useMemo(() => filterPriceHistoryByDays(data, windowDays), [data, windowDays]);
  const analytics = buildPriceAnalytics(visibleData, currentPrice);
  const forecast = forecastPrice(visibleData);
  return (
    <div className="bg-slate-900 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white" style={{ fontWeight: 600 }}>Lịch Sử Giá ({windowDays} ngày)</h3>
          <p className="text-slate-500 text-sm mt-0.5">Theo dõi biến động để biết thời điểm mua tốt nhất</p>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>ĐANG Ở MỨC THẤP NHẤT</div>
          <div className="text-white" style={{ fontWeight: 700 }}>
            {formatMillion(currentPrice)}₫
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" aria-label="Khoảng thời gian lịch sử giá">
        {PRICE_HISTORY_WINDOWS.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={windowDays === days}
            onClick={() => setWindowDays(days)}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${windowDays === days ? "bg-sky-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
          >
            {days} ngày
          </button>
        ))}
      </div>

      <div style={{ height: 200 }}>
        {visibleData.length ? <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatMillion}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={normalPrice}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: "Giá gốc", fill: "#ef4444", fontSize: 10, position: "right" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={{ fill: "#0ea5e9", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "#0ea5e9", r: 5, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-500 text-sm">Chưa có quan sát hợp lệ trong khoảng này.</div>}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-6 h-0.5 bg-sky-500 rounded" />
          <span>Giá thực tế</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-6 h-0.5 bg-red-500 rounded border-dashed" style={{ borderTop: "2px dashed #ef4444", height: 0 }} />
          <span>Giá gốc thông thường</span>
        </div>
      </div>
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5" aria-label="Tóm tắt phân tích giá">
          <div><p className="text-slate-500 text-[11px]">Median</p><p className="text-white text-sm font-semibold">{formatMillion(analytics.median)}₫</p></div>
          <div><p className="text-slate-500 text-[11px]">Biến động</p><p className="text-white text-sm font-semibold">{analytics.volatilityPercent.toFixed(1)}%</p></div>
          <div><p className="text-slate-500 text-[11px]">Percentile hiện tại</p><p className="text-white text-sm font-semibold">{analytics.currentPercentile ?? "—"}%</p></div>
          <div><p className="text-slate-500 text-[11px]">Ngày rẻ nhất</p><p className="text-white text-sm font-semibold">{analytics.cheapestWeekday == null ? "—" : ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][analytics.cheapestWeekday]}</p></div>
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-white/5" aria-label="Dự báo xu hướng giá">
        {forecast ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div><p className="text-slate-500 text-[11px]">Xu hướng {forecast.horizonDays} ngày tới</p><p className="text-white text-sm font-semibold">{forecast.direction === "up" ? "Có xu hướng tăng" : forecast.direction === "down" ? "Có xu hướng giảm" : "Tương đối ổn định"} · xác suất {Math.round(forecast.probability * 100)}%</p></div>
            <p className="text-slate-500 text-[11px] max-w-sm">{forecast.limitation}</p>
          </div>
        ) : <p className="text-slate-500 text-xs">Chưa đủ 14 quan sát hợp lệ để ước tính xu hướng giá.</p>}
      </div>
    </div>
  );
}
