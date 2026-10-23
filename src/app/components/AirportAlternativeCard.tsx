import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, Plane, Car, Clock, ShieldCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { AirportAlternativeEvaluation } from '../../domain/farely/airportAlternatives';
import { formatVND } from '../data/deals';

interface AirportAlternativeCardProps {
  evaluation: AirportAlternativeEvaluation;
  alternativeDealId?: string;
  className?: string;
}

export const AirportAlternativeCard: React.FC<AirportAlternativeCardProps> = ({
  evaluation,
  alternativeDealId,
  className = '',
}) => {
  const isRec = evaluation.verdict === 'RECOMMENDED';
  const isMarginal = evaluation.verdict === 'MARGINAL';

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-all ${
        isRec
          ? 'border-emerald-200 bg-emerald-50/50'
          : isMarginal
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-stone-200 bg-stone-50'
      } ${className}`}
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isRec ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Khuyến nghị đổi sân bay lân cận</span>
            </span>
          ) : isMarginal ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <Info className="w-3.5 h-3.5" />
              <span>Tiết kiệm ít so với thời gian di chuyển</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700 border border-stone-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Không nên đổi sân bay</span>
            </span>
          )}
          <span className="text-xs text-stone-500 font-medium">
            (So sánh sân bay cùng cụm metro / lân cận)
          </span>
        </div>

        {alternativeDealId && (
          <Link
            to={`/deals/${alternativeDealId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>Xem chi tiết chuyến {evaluation.alternativeAirportCode}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Airport Swap Title */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-sm font-bold text-stone-900">
          {evaluation.baselineAirportName} ({evaluation.baselineAirportCode})
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-sm font-bold text-blue-700">
          {evaluation.alternativeAirportName} ({evaluation.alternativeAirportCode})
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
        {/* 1. Air Fare Difference */}
        <div className="bg-white rounded-lg p-2.5 border border-stone-200">
          <div className="flex items-center gap-1 text-stone-500 mb-1">
            <Plane className="w-3.5 h-3.5 text-blue-600" />
            <span>Chênh lệch vé máy bay</span>
          </div>
          <div className="font-mono font-bold text-stone-900">
            {evaluation.airFareSavingsVND > 0
              ? `Rẻ hơn ${formatVND(evaluation.airFareSavingsVND)}`
              : `Đắt hơn ${formatVND(Math.abs(evaluation.airFareSavingsVND))}`}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            Vé gốc: {formatVND(evaluation.baselinePrice)} → Vé phụ: {formatVND(evaluation.alternativePrice)}
          </div>
        </div>

        {/* 2. Ground Transfer Cost & Time */}
        <div className="bg-white rounded-lg p-2.5 border border-stone-200">
          <div className="flex items-center gap-1 text-stone-500 mb-1">
            <Car className="w-3.5 h-3.5 text-amber-600" />
            <span>Chi phí di chuyển mặt đất</span>
          </div>
          <div className="font-mono font-bold text-stone-900">
            ~{formatVND(evaluation.groundTransfer.estimatedCostVND)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>Khoảng {evaluation.groundTransfer.typicalMinutes} phút ({evaluation.groundTransfer.distanceKm} km)</span>
          </div>
        </div>

        {/* 3. Net Savings */}
        <div
          className={`rounded-lg p-2.5 border ${
            evaluation.netSavingsVND > 0
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-rose-50/80 border-rose-200'
          }`}
        >
          <div className="text-[11px] font-semibold text-stone-600 mb-1">
            Tiết kiệm ròng thực tế
          </div>
          <div
            className={`font-mono font-extrabold text-sm ${
              evaluation.netSavingsVND > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {evaluation.netSavingsVND > 0
              ? `+${formatVND(evaluation.netSavingsVND)}`
              : `-${formatVND(Math.abs(evaluation.netSavingsVND))}`}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            (Đã trừ toàn bộ cước phí trung chuyển đường bộ)
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="text-xs leading-relaxed text-stone-700 bg-white/80 rounded-lg p-3 border border-stone-200">
        <p className="font-medium text-stone-800">{evaluation.tradeoffExplanation}</p>
        <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-stone-400" />
            <span>Nguồn cước di chuyển: {evaluation.groundTransfer.sourceName}</span>
          </span>
          {evaluation.groundTransfer.isVerifiedSource ? (
            <span className="text-emerald-700 font-semibold">✓ Đã đối chiếu bảng cước chính thức</span>
          ) : (
            <span className="text-amber-700 font-semibold">⚠ Ước tính thuật toán</span>
          )}
        </div>
      </div>
    </div>
  );
};
