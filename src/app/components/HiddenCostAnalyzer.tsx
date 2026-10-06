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
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-stone-900 font-semibold text-sm">Bóc Tách Chi Phí Thực Tế (True Cost)</h3>
          <p className="text-stone-500 text-xs">Minh bạch giá vé đã biết, ước tính và các phụ phí chưa xác định</p>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {/* 1. GIÁ ĐÃ BIẾT */}
        <div className="space-y-2">
          <div className="text-stone-600 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>1. Giá đã biết</span>
            <span className="text-[10px] text-emerald-700 font-semibold">Đã gồm thuế & phí sân bay bắt buộc</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-stone-900 text-sm font-medium">Giá vé cơ bản quan sát</span>
            </div>
            <span className="text-emerald-700 text-sm font-bold tabular-nums font-mono">
              {formatVND(deal.advertisedTotal)}
            </span>
          </div>

          {trueCost.components
            .filter((c) => c.state === "KNOWN" && c.category !== "fare")
            .map((cost, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-stone-800 text-sm">{cost.label}</span>
                    {cost.note && (
                      <span className="text-emerald-700 text-xs ml-2">({cost.note})</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-emerald-700 font-semibold tabular-nums font-mono">
                  {cost.amount === 0 ? "Bao gồm" : `+${formatVND(cost.amount ?? 0)}`}
                </span>
              </div>
            ))}
        </div>

        {/* 2. CÓ THỂ PHÁT SINH */}
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <div className="text-stone-600 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>2. Có thể phát sinh</span>
            <span className="text-[10px] text-amber-700 font-semibold">Dự kiến theo hãng và hạng vé</span>
          </div>

          {trueCost.components
            .filter((c) => c.state === "ESTIMATED")
            .map((cost, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <div>
                  <span className="text-stone-900 text-sm font-medium">{cost.label}</span>
                  {cost.note && <p className="text-[11px] text-stone-600">{cost.note}</p>}
                </div>
                <span className="text-sm text-amber-800 font-semibold tabular-nums font-mono">
                  +{formatVND(cost.amount ?? 0)}
                </span>
              </div>
            ))}

          <div className="pt-2 space-y-2">
            <span className="text-[11px] text-stone-600 block font-medium">Tự ước tính thêm theo nhu cầu:</span>
            {userFields.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-xs text-stone-600">
                <span>{label}</span>
                <input
                  aria-label={label}
                  type="number"
                  min={0}
                  step={50000}
                  value={userCosts[key] || ""}
                  onChange={(event) => setUserCosts((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value) || 0) }))}
                  placeholder="0"
                  className="w-32 bg-white border border-stone-300 text-stone-900 rounded-lg px-2 py-1.5 text-right tabular-nums font-mono text-xs focus:border-blue-600 focus:outline-none"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 3. CHƯA XÁC ĐỊNH */}
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <div className="text-stone-600 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>3. Chưa xác định</span>
            <span className="text-[10px] text-stone-500">Cần đối chiếu tại bước thanh toán</span>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 leading-relaxed space-y-1.5">
            {trueCost.components
              .filter((c) => c.state === "UNKNOWN" || c.state === "OPTIONAL")
              .map((c, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-stone-400 shrink-0" />
                  <div>
                    <span className="text-stone-800 font-medium">{c.label}: </span>
                    <span className="text-stone-600">{c.note}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Divider & Total */}
      <div className="border-t border-stone-200 pt-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-stone-900 font-semibold text-sm">{trueCost.totalLabel}</span>
            <p className="text-[11px] text-stone-500">Chưa bao gồm các phụ phí chưa xác định</p>
          </div>
          <div className="text-right">
            <div className="text-stone-900 text-xl font-bold tabular-nums font-mono">
              {formatVND(grandEstimatedTotal)}
            </div>
            <div className="text-stone-500 text-xs">Giá quan sát gốc: {formatVND(deal.advertisedTotal)}</div>
          </div>
        </div>
      </div>

      {/* Epistemic disclaimer */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-stone-700 text-xs leading-relaxed">
          Farely không tự động coi các chi phí chưa rõ là 0₫. Luôn đối chiếu kỹ phí hành lý và phụ phí thanh toán trước khi hoàn tất đặt vé.
        </p>
      </div>
    </div>
  );
}
