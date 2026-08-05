import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Deal, formatVND } from "../data/deals";

interface HiddenCostAnalyzerProps {
  deal: Deal;
}

export function HiddenCostAnalyzer({ deal }: HiddenCostAnalyzerProps) {
  const [userCosts, setUserCosts] = useState({ baggage: 0, seat: 0, payment: 0 });
  const knownExtra = Math.max(0, deal.realTotal - deal.advertisedTotal);
  const userExtra = userCosts.baggage + userCosts.seat + userCosts.payment;
  const estimatedTotal = deal.advertisedTotal + knownExtra + userExtra;
  const extra = Math.max(0, estimatedTotal - deal.advertisedTotal);
  const extraPercent = deal.advertisedTotal > 0
    ? Math.round((extra / deal.advertisedTotal) * 100)
    : 0;
  const isCostly = extraPercent > 30;

  const userFields = useMemo(() => [
    ["baggage", "Hành lý thêm"],
    ["seat", "Chọn chỗ"],
    ["payment", "Phí thanh toán"],
  ] as const, []);

  return (
    <div className="bg-slate-900 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-white" style={{ fontWeight: 600 }}>Phân Tích Chi Phí Ẩn</h3>
          <p className="text-slate-500 text-xs">"Giá trên vé" vs "Giá bạn thực sự trả"</p>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="space-y-2 mb-4">
        {/* Base price */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-sm">Giá vé cơ bản</span>
          </div>
          <span className="text-emerald-400 text-sm" style={{ fontWeight: 700 }}>
            {formatVND(deal.advertisedTotal)}
          </span>
        </div>

        {/* Hidden costs */}
        {deal.hiddenCosts.map((cost, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
            <div className="flex items-center gap-2">
              {cost.amount === 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400/60" />
              ) : (
                <Info className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <span className="text-slate-300 text-sm">{cost.label}</span>
                {cost.note && (
                  <span className="text-emerald-500 text-xs ml-2">({cost.note})</span>
                )}
              </div>
            </div>
            <span
              className={`text-sm ${cost.amount === 0 ? "text-emerald-500" : "text-amber-400"}`}
              style={{ fontWeight: 600 }}
            >
              {cost.amount === 0 ? "Miễn phí" : `+${formatVND(cost.amount)}`}
            </span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <p className="text-slate-500 text-xs">Tuỳ chọn cá nhân (chưa gồm trong giá):</p>
          {userFields.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>{label}</span>
              <input
                aria-label={label}
                type="number"
                min={0}
                step={50000}
                value={userCosts[key] || ""}
                onChange={(event) => setUserCosts((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value) || 0) }))}
                placeholder="0"
                className="w-32 bg-slate-800 border border-white/10 text-white rounded-lg px-2 py-1.5 text-right"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/8 pt-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300" style={{ fontWeight: 600 }}>Tổng thực tế phải trả</span>
          <div className="text-right">
            <div className="text-white" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              {formatVND(estimatedTotal)}
            </div>
            <div className="text-slate-500 text-xs">so với giá quảng cáo {formatVND(deal.advertisedTotal)}</div>
          </div>
        </div>
      </div>

      {/* Warning / info */}
      {extra > 0 ? (
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${isCostly ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isCostly ? "text-red-400" : "text-amber-400"}`} />
          <div>
            <p className={`text-sm ${isCostly ? "text-red-300" : "text-amber-300"}`} style={{ fontWeight: 600 }}>
              Chi phí ẩn +{formatVND(extra)} ({extraPercent}% giá vé)
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {isCostly
                ? "Chi phí ẩn khá cao so với giá vé. Hãy tính kỹ trước khi mua."
                : "Chênh lệch không nhiều — deal vẫn tốt sau khi tính đủ phí."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-emerald-300 text-sm">Không có chi phí ẩn đáng kể. Giá quảng cáo = giá thực trả.</p>
        </div>
      )}
    </div>
  );
}
