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
  const hasSufficientData = visibleData.length >= 5;

  return (
    <div className="bg-slate-900 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Mặt Bằng Giá Quan Sát ({windowDays} ngày)</h3>
          <p className="text-slate-400 text-xs mt-0.5">Dữ liệu tham chiếu toàn tuyến; không phải lịch sử riêng của một giờ bay cố định</p>
        </div>
        <div className="text-right">
          {!hasSufficientData ? (
            <div className="text-slate-400 text-xs font-medium">Chưa đủ mẫu đối sánh</div>
          ) : analytics && currentPrice <= analytics.lowest ? (
            <div className="text-emerald-400 text-xs font-semibold">
              Đang ở mức thấp nhất ({visibleData.length} quan sát)
            </div>
          ) : analytics ? (
            <div className="text-slate-400 text-xs font-medium">Đáy kỳ: {formatMillion(analytics.lowest)}₫</div>
          ) : null}
          <div className="text-white font-bold tabular-nums">
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
              label={{ value: "Median tham chiếu", fill: "#ef4444", fontSize: 10, position: "right" }}
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
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-6 h-0.5 bg-sky-500 rounded" />
          <span>Giá quan sát</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-6 h-0.5 bg-red-500 rounded border-dashed" style={{ borderTop: "2px dashed #ef4444", height: 0 }} />
          <span>Mặt bằng tham chiếu</span>
        </div>
      </div>
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5" aria-label="Tóm tắt phân tích giá">
          <div><p className="text-slate-500 text-[11px]">Median tuyến</p><p className="text-white text-sm font-semibold tabular-nums">{formatMillion(analytics.median)}₫</p></div>
          <div><p className="text-slate-500 text-[11px]">Biến động giá</p><p className="text-white text-sm font-semibold tabular-nums">{analytics.volatilityPercent.toFixed(1)}%</p></div>
          <div><p className="text-slate-500 text-[11px]">Vị thế percentile</p><p className="text-white text-sm font-semibold tabular-nums">{analytics.currentPercentile ?? "—"}%</p></div>
          <div><p className="text-slate-500 text-[11px]">Mẫu quan sát</p><p className="text-white text-sm font-semibold tabular-nums">{visibleData.length} điểm giá</p></div>
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-white/5" aria-label="Dự báo xu hướng giá">
        {forecast ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-slate-500 text-[11px]">Mô tả biến động gần đây ({forecast.horizonDays} ngày)</p>
              <p className="text-white text-sm font-semibold">
                {forecast.direction === "up" ? "Quan sát gần đây có xu hướng tăng" : forecast.direction === "down" ? "Quan sát gần đây có xu hướng giảm" : "Quan sát gần đây giữ mức tương đối ổn định"}
              </p>
            </div>
            <p className="text-slate-500 text-[11px] max-w-sm">{forecast.limitation}</p>
          </div>
        ) : <p className="text-slate-500 text-xs">Chưa đủ 14 quan sát hợp lệ để xác định xu hướng biến động.</p>}
      </div>
    </div>
  );
}
