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
      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-lg">
        <p className="text-stone-500 text-xs mb-1">{label}</p>
        <p className="text-stone-900 text-sm font-bold font-mono">
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
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-stone-900 font-semibold text-sm">Mặt Bằng Giá Quan Sát ({windowDays} ngày)</h3>
          <p className="text-stone-500 text-xs mt-0.5">Dữ liệu tham chiếu toàn tuyến; không phải lịch sử riêng của một giờ bay cố định</p>
        </div>
        <div className="text-right">
          {!hasSufficientData ? (
            <div className="text-stone-500 text-xs font-medium">Chưa đủ mẫu đối sánh</div>
          ) : analytics && currentPrice <= analytics.lowest ? (
            <div className="text-emerald-700 text-xs font-semibold">
              Đang ở mức thấp nhất ({visibleData.length} quan sát)
            </div>
          ) : analytics ? (
            <div className="text-stone-600 text-xs font-medium">Đáy kỳ: {formatMillion(analytics.lowest)}₫</div>
          ) : null}
          <div className="text-stone-900 font-bold tabular-nums font-mono">
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
            className={`rounded-full px-3 py-1 text-xs transition-colors font-medium ${
              windowDays === days
                ? "bg-blue-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {days} ngày
          </button>
        ))}
      </div>

      <div style={{ height: 200 }}>
        {visibleData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: "Median tham chiếu", fill: "#dc2626", fontSize: 10, position: "right" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={{ fill: "#2563eb", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#2563eb", r: 5, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-500 text-sm">
            Chưa có quan sát hợp lệ trong khoảng này.
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <div className="w-6 h-0.5 bg-blue-600 rounded" />
          <span>Giá quan sát</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <div className="w-6 h-0.5 bg-red-600 rounded border-dashed" style={{ borderTop: "2px dashed #dc2626", height: 0 }} />
          <span>Mặt bằng tham chiếu</span>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100" aria-label="Tóm tắt phân tích giá">
          <div><p className="text-stone-500 text-[11px]">Median tuyến</p><p className="text-stone-900 text-sm font-semibold tabular-nums font-mono">{formatMillion(analytics.median)}₫</p></div>
          <div><p className="text-stone-500 text-[11px]">Biến động giá</p><p className="text-stone-900 text-sm font-semibold tabular-nums font-mono">{analytics.volatilityPercent.toFixed(1)}%</p></div>
          <div><p className="text-stone-500 text-[11px]">Vị thế percentile</p><p className="text-stone-900 text-sm font-semibold tabular-nums font-mono">{analytics.currentPercentile ?? "—"}%</p></div>
          <div><p className="text-stone-500 text-[11px]">Mẫu quan sát</p><p className="text-stone-900 text-sm font-semibold tabular-nums font-mono">{visibleData.length} điểm giá</p></div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-stone-100" aria-label="Dự báo xu hướng giá">
        {forecast ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-stone-500 text-[11px]">Mô tả biến động gần đây ({forecast.horizonDays} ngày)</p>
              <p className="text-stone-900 text-sm font-semibold">
                {forecast.direction === "up" ? "Quan sát gần đây có xu hướng tăng" : forecast.direction === "down" ? "Quan sát gần đây có xu hướng giảm" : "Quan sát gần đây giữ mức tương đối ổn định"}
              </p>
            </div>
            <p className="text-stone-500 text-[11px] max-w-sm">{forecast.limitation}</p>
          </div>
        ) : (
          <p className="text-stone-500 text-xs">Chưa đủ 14 quan sát hợp lệ để xác định xu hướng biến động.</p>
        )}
      </div>
    </div>
  );
}
