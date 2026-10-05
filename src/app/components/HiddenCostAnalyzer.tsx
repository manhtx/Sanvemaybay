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
        <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center">
          <Info className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <h3 className="text-white" style={{ fontWeight: 600 }}>Bóc Tách Chi Phí Thực Tế (True Cost)</h3>
          <p className="text-slate-500 text-xs">Minh bạch giá vé đã biết, ước tính và các phụ phí chưa xác định</p>
        </div>
      </div>

      {/* 1. KNOWN COSTS */}
      <div className="space-y-2 mb-4">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>1. Đã biết (Known)</span>
          <span className="text-[10px] text-emerald-400">Đã gồm thuế & phí cơ bản</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-sm">Giá vé cơ bản đã quan sát</span>
          </div>
          <span className="text-emerald-400 text-sm" style={{ fontWeight: 700 }}>
            {formatVND(deal.advertisedTotal)}
          </span>
        </div>

        {deal.hiddenCosts.map((cost, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400/60" />
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

        {/* 2. ESTIMATED EXTRA COSTS */}
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>2. Ước tính thêm (Estimated)</span>
            <span className="text-[10px] text-amber-400">Tuỳ chọn theo nhu cầu</span>
          </div>
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

        {/* 3. UNKNOWN COSTS NOTICE */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>3. Chưa thể xác định (Unknown ≠ 0)</span>
            <span className="text-[10px] text-slate-500">Tại bước thanh toán</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-800/30 p-3 text-xs text-slate-400 leading-relaxed space-y-1">
            <p>• Phụ phí cổng thanh toán (thẻ tín dụng quốc tế / thẻ ghi nợ nội địa)</p>
            <p>• Phí chọn vị trí ghế ngồi đặc biệt trên chuyến bay</p>
            <p>• Bảo hiểm chuyến đi hoặc dịch vụ hỗ trợ phát sinh</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/8 pt-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300" style={{ fontWeight: 600 }}>Tổng ước tính phải trả</span>
          <div className="text-right">
            <div className="text-white" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              {formatVND(estimatedTotal)}
            </div>
            <div className="text-slate-500 text-xs">Giá quan sát: {formatVND(deal.advertisedTotal)}</div>
          </div>
        </div>
      </div>

      {/* Warning / info */}
      {extra > 0 ? (
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${isCostly ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isCostly ? "text-red-400" : "text-amber-400"}`} />
          <div>
            <p className={`text-sm ${isCostly ? "text-red-300" : "text-amber-300"}`} style={{ fontWeight: 600 }}>
              Phát sinh ước tính +{formatVND(extra)} ({extraPercent}% giá vé)
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {isCostly
                ? "Chi phí phát sinh ước tính khá lớn so với giá vé. Hãy cân nhắc kỹ trước khi quyết định."
                : "Chi phí phát sinh ở mức thông thường — cơ hội vẫn có mức giá tốt sau khi tính đủ phí."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
          <p className="text-sky-300 text-xs leading-relaxed">
            Giá vé cơ bản đã bao gồm thuế & phí sân bay bắt buộc. Lưu ý: Luôn kiểm tra lại các phụ phí phát sinh (hành lý, thanh toán) tại bước đặt vé cuối cùng.
          </p>
        </div>
      )}
    </div>
  );
}
