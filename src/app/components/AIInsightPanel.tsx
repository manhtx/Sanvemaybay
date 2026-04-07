import { Sparkles, ShieldCheck, ShieldAlert, TrendingDown, Clock, CheckCircle2 } from "lucide-react";
import { Deal, getRiskColor, getRiskBg, getRecommendationColor, getRecommendationLabel } from "../data/mockDeals";

interface AIInsightPanelProps {
  deal: Deal;
}

const riskLabel = { low: "Thấp", medium: "Trung Bình", high: "Cao" };
const riskIcon = {
  low: ShieldCheck,
  medium: ShieldAlert,
  high: ShieldAlert,
};

export function AIInsightPanel({ deal }: AIInsightPanelProps) {
  const { aiInsight } = deal;
  const RiskIcon = riskIcon[aiInsight.risk];

  return (
    <div className="bg-slate-900 border border-sky-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500/10 to-violet-500/10 border-b border-white/5 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white" style={{ fontWeight: 700 }}>Phân Tích AI</h3>
            <p className="text-slate-400 text-sm">Vì sao deal này rẻ? Có nên mua không?</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Reason */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-sky-400" />
            <span className="text-sky-400 text-sm" style={{ fontWeight: 600 }}>Lý do giá giảm</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/50 rounded-xl p-4">
            {aiInsight.reason}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {aiInsight.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs rounded-full"
              style={{ fontWeight: 600 }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Risk assessment */}
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${getRiskBg(aiInsight.risk)}`}>
          <RiskIcon className={`w-5 h-5 mt-0.5 shrink-0 ${getRiskColor(aiInsight.risk)}`} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white text-sm" style={{ fontWeight: 600 }}>Mức độ rủi ro: </span>
              <span className={`text-sm ${getRiskColor(aiInsight.risk)}`} style={{ fontWeight: 700 }}>
                {riskLabel[aiInsight.risk]}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{aiInsight.riskDetails}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>Khuyến nghị của AI</span>
            <span className={`ml-auto px-3 py-0.5 rounded-full text-xs ${getRecommendationColor(aiInsight.recommendation)}`} style={{ fontWeight: 700 }}>
              {getRecommendationLabel(aiInsight.recommendation)}
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{aiInsight.recommendationNote}</p>
        </div>

        {/* Saving score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Điểm Deal (AI Score)</span>
            <span className="text-emerald-400" style={{ fontWeight: 800, fontSize: "1.1rem" }}>
              {aiInsight.savingScore}
              <span className="text-slate-500 text-sm" style={{ fontWeight: 400 }}>/100</span>
            </span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${aiInsight.savingScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-600 text-xs">Không đáng</span>
            <span className="text-slate-600 text-xs">Xuất sắc</span>
          </div>
        </div>

        {/* Urgency */}
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <Clock className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <span className="text-red-300 text-sm" style={{ fontWeight: 600 }}>Deal hết hạn trong {deal.expiresIn}</span>
            <span className="text-slate-500 text-xs ml-2">• Còn {deal.seatsLeft} ghế</span>
          </div>
        </div>
      </div>
    </div>
  );
}
