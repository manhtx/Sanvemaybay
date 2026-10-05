import { useMemo, useState } from "react";
import { CheckCircle, HelpCircle, Info } from "lucide-react";
import { Deal, formatVND } from "../data/deals";
import { evaluateTrueCost } from "../domain/costEpistemic";

interface HiddenCostAnalyzerProps {
  deal: Deal;
}

export function HiddenCostAnalyzer({ deal }: HiddenCostAnalyzerProps) {
  const [userCosts, setUserCosts] = useState({ baggage: 0, seat: 0, payment: 0 });

  const trueCost = useMemo(() => {
    return evaluateTrueCost({
      basePrice: deal.advertisedTotal,
      airlineCode: deal.airlineCode,
      region: deal.region,
      providedHiddenCosts: deal.hiddenCosts,
    });
  }, [deal]);

  const userExtra = userCosts.baggage + userCosts.seat + userCosts.payment;
  const grandEstimatedTotal = trueCost.estimatedTotal + userExtra;

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

      <div className="space-y-4 mb-4">
        {/* 1. ĐÃ BIẾT (KNOWN) */}
        <div className="space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>1. Đã biết (Known)</span>
            <span className="text-[10px] text-emerald-400">Đã gồm thuế sân bay bắt buộc</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white text-sm">Giá vé cơ bản quan sát</span>
            </div>
            <span className="text-emerald-400 text-sm font-bold">
              {formatVND(deal.advertisedTotal)}
            </span>
          </div>

          {trueCost.components
            .filter((c) => c.state === "KNOWN" && c.category !== "fare")
            .map((cost, idx) => (
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
                <span className="text-sm text-emerald-500 font-semibold">
                  {cost.amount === 0 ? "Bao gồm" : `+${formatVND(cost.amount ?? 0)}`}
                </span>
              </div>
            ))}
        </div>

        {/* 2. ƯỚC TÍNH THÊM (ESTIMATED) */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>2. Ước tính thêm (Estimated)</span>
            <span className="text-[10px] text-amber-400">Dự kiến theo loại vé</span>
          </div>

          {trueCost.components
            .filter((c) => c.state === "ESTIMATED")
            .map((cost, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-amber-500/[0.04] border border-amber-500/10 rounded-xl">
                <div>
                  <span className="text-slate-200 text-sm">{cost.label}</span>
                  {cost.note && <p className="text-[11px] text-slate-400">{cost.note}</p>}
                </div>
                <span className="text-sm text-amber-400 font-semibold">
                  +{formatVND(cost.amount ?? 0)}
                </span>
              </div>
            ))}

          <div className="pt-2 space-y-2">
            <span className="text-[11px] text-slate-400 block font-medium">Tự ước tính thêm theo nhu cầu:</span>
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

        {/* 3. TÙY CHỌN & CHƯA BIẾT (UNKNOWN != 0) */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>3. Tùy chọn & Chưa thể xác định (Unknown ≠ 0)</span>
            <span className="text-[10px] text-slate-400">Tại trang đặt vé</span>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-800/30 p-3 text-xs text-slate-400 leading-relaxed space-y-1.5">
            {trueCost.components
              .filter((c) => c.state === "UNKNOWN" || c.state === "OPTIONAL")
              .map((c, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-slate-300 font-medium">{c.label}: </span>
                    <span className="text-slate-400">{c.note}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Divider & Total */}
      <div className="border-t border-white/8 pt-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-slate-200 font-semibold">{trueCost.totalLabel}</span>
            <p className="text-[11px] text-slate-500">Chưa bao gồm các phụ phí chưa xác định</p>
          </div>
          <div className="text-right">
            <div className="text-white text-xl font-extrabold tabular-nums">
              {formatVND(grandEstimatedTotal)}
            </div>
            <div className="text-slate-400 text-xs">Giá quan sát gốc: {formatVND(deal.advertisedTotal)}</div>
          </div>
        </div>
      </div>

      {/* Epistemic disclaimer */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-slate-300 text-xs leading-relaxed">
          Farely không tự động coi các chi phí chưa rõ là 0₫. Luôn đối chiếu kỹ phí hành lý và phụ phí thanh toán trước khi hoàn tất đặt vé.
        </p>
      </div>
    </div>
  );
}
