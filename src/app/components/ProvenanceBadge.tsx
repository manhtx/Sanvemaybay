import { useState } from "react";
import { Eye, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Info, Clock, CheckCircle2 } from "lucide-react";
import { Deal } from "../data/deals";
import { buildDataProvenance, DataProvenance } from "../domain/provenance";

export interface ProvenanceBadgeProps {
  deal: Deal;
  variant?: "compact" | "detailed";
  className?: string;
}

export function ProvenanceBadge({ deal, variant = "compact", className = "" }: ProvenanceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prov: DataProvenance = buildDataProvenance(deal);

  const statusColor =
    prov.status === "VERIFIED"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : prov.status === "UNAVAILABLE"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : "bg-blue-50 text-blue-800 border-blue-200";

  const StatusIcon =
    prov.status === "VERIFIED"
      ? CheckCircle2
      : prov.status === "UNAVAILABLE"
      ? AlertCircle
      : Eye;

  if (variant === "detailed") {
    return (
      <div className={`rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${statusColor}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{prov.statusLabel}</span>
            </span>
            <span className="text-xs text-stone-500 font-medium">
              {prov.ageLabel}
            </span>
          </div>

          <span className="text-[11px] font-mono text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded">
            {prov.sourceMode === "AIRLINE_DIRECT" ? "Hãng trực tiếp" : "Quét tự động"}
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          {prov.disclaimer}
        </p>

        <div className="pt-2 border-t border-stone-200/60 grid grid-cols-2 gap-2 text-[11px] text-stone-500">
          <div>
            <span className="text-stone-400 block">Nguồn dữ liệu:</span>
            <span className="font-semibold text-stone-700">{prov.sourceName}</span>
          </div>
          <div>
            <span className="text-stone-400 block">Mức độ bằng chứng:</span>
            <span className="font-semibold text-stone-700">{prov.confidenceLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer hover:bg-stone-100 ${statusColor}`}
        aria-expanded={isOpen}
        aria-label="Xem chi tiết nguồn gốc và độ mới của giá vé"
      >
        <StatusIcon className="w-3 h-3 shrink-0" />
        <span>{prov.statusLabel}</span>
        <span className="text-stone-300">·</span>
        <span className="tabular-nums">{prov.ageLabel}</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-stone-400 shrink-0 ml-0.5" />
        ) : (
          <ChevronDown className="w-3 h-3 text-stone-400 shrink-0 ml-0.5" />
        )}
      </button>

      {isOpen && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute left-0 top-full mt-1.5 z-30 w-72 p-3.5 rounded-xl border border-stone-200 bg-white shadow-xl text-xs space-y-2.5 animate-in fade-in duration-100 text-stone-800 text-left"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="font-bold text-stone-900 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Nguồn gốc dữ liệu (Provenance)
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${statusColor}`}>
              {prov.status}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-stone-600">
            <div className="flex justify-between">
              <span className="text-stone-500">Nguồn thu thập:</span>
              <span className="font-semibold text-stone-800 text-right">{prov.sourceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Thời điểm ghi nhận:</span>
              <span className="font-mono text-stone-800">{prov.ageLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Độ tin cậy mẫu:</span>
              <span className="text-stone-800 font-semibold">{prov.confidenceLabel}</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg leading-relaxed border border-stone-100">
            {prov.disclaimer}
          </p>

          <div className="text-[10px] text-stone-400 pt-1 flex items-center justify-between">
            <span>Tiêu chuẩn minh bạch F35</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
