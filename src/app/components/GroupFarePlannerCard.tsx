import { useState, useMemo } from "react";
import { Users, Luggage, Info, AlertCircle, ShieldCheck } from "lucide-react";
import { Deal, formatVND } from "../data/deals";
import {
  calculateGroupFamilyFare,
  PassengerPartyComposition,
  BaggageOption,
  validatePassengerParty,
} from "../../domain/farely/groupFarePlanner";

interface GroupFarePlannerCardProps {
  deal: Deal;
  onPassengerMixChange?: (mix: PassengerPartyComposition) => void;
}

export function GroupFarePlannerCard({ deal, onPassengerMixChange }: GroupFarePlannerCardProps) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [adultBaggage, setAdultBaggage] = useState<BaggageOption>("none");
  const [childBaggage, setChildBaggage] = useState<BaggageOption>("none");

  const segmentsCount = deal.returnDate ? 2 : 1;

  const party: PassengerPartyComposition = useMemo(
    () => ({ adults, children, infants }),
    [adults, children, infants]
  );

  const validationError = useMemo(() => {
    try {
      validatePassengerParty(party);
      return null;
    } catch (err: any) {
      return err?.message || "Cơ cấu hành khách không hợp lệ";
    }
  }, [party]);

  const groupFare = useMemo(() => {
    if (validationError) return null;
    return calculateGroupFamilyFare({
      baseAdultFarePerPerson: deal.price,
      party,
      segmentsCount,
      baggageSelection: {
        adultsBaggage: Array(adults).fill(adultBaggage),
        childrenBaggage: Array(children).fill(childBaggage),
      },
    });
  }, [deal.price, party, segmentsCount, adultBaggage, childBaggage, validationError]);

  const handleAdultsChange = (val: number) => {
    const nextAdults = Math.max(1, Math.min(9, val));
    setAdults(nextAdults);
    if (infants > nextAdults) {
      setInfants(nextAdults);
    }
    onPassengerMixChange?.({ adults: nextAdults, children, infants: Math.min(infants, nextAdults) });
  };

  const handleChildrenChange = (val: number) => {
    const nextChildren = Math.max(0, Math.min(8, val));
    setChildren(nextChildren);
    onPassengerMixChange?.({ adults, children: nextChildren, infants });
  };

  const handleInfantsChange = (val: number) => {
    const nextInfants = Math.max(0, Math.min(adults, val));
    setInfants(nextInfants);
    onPassengerMixChange?.({ adults, children, infants: nextInfants });
  };

  const isMultiTraveler = adults + children + infants > 1 || adultBaggage !== "none" || childBaggage !== "none";

  return (
    <section
      className="rounded-xl border border-stone-200 bg-white p-6 space-y-5 shadow-sm"
      aria-labelledby="group-fare-planner-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 id="group-fare-planner-heading" className="text-sm font-bold uppercase tracking-wider text-stone-900">
              Kế hoạch giá vé Gia đình &amp; Nhóm (Group Fare Planner)
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Tính toán chính xác theo độ tuổi (người lớn, trẻ em 2-11 tuổi, em bé &lt;2 tuổi) và gói hành lý ký gửi.
          </p>
        </div>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md self-start sm:self-auto font-mono">
          {segmentsCount === 2 ? "Khứ hồi (2 chặng)" : "Một chiều (1 chặng)"}
        </span>
      </div>

      {/* Passenger Selection Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Adults */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="adults-count" className="text-xs font-bold text-stone-800">
              Người lớn
            </label>
            <span className="text-[10px] text-stone-500">Từ 12 tuổi</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={adults <= 1}
              onClick={() => handleAdultsChange(adults - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span id="adults-count" className="font-mono font-bold text-sm text-stone-900">
              {adults}
            </span>
            <button
              type="button"
              disabled={adults >= 9}
              onClick={() => handleAdultsChange(adults + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        {/* Children */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="children-count" className="text-xs font-bold text-stone-800">
              Trẻ em
            </label>
            <span className="text-[10px] text-emerald-700 font-medium">2 - 11 tuổi (75% giá)</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={children <= 0}
              onClick={() => handleChildrenChange(children - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span id="children-count" className="font-mono font-bold text-sm text-stone-900">
              {children}
            </span>
            <button
              type="button"
              disabled={children >= 8}
              onClick={() => handleChildrenChange(children + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        {/* Infants */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
          <div className="flex justify-between items-baseline mb-2">
            <label htmlFor="infants-count" className="text-xs font-bold text-stone-800">
              Em bé
            </label>
            <span className="text-[10px] text-blue-700 font-medium">&lt; 2 tuổi (110k/chặng)</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={infants <= 0}
              onClick={() => handleInfantsChange(infants - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span id="infants-count" className="font-mono font-bold text-sm text-stone-900">
              {infants}
            </span>
            <button
              type="button"
              disabled={infants >= adults}
              onClick={() => handleInfantsChange(infants + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Baggage Selection */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
          <Luggage className="w-4 h-4 text-stone-600" />
          <span>Tùy chọn hành lý ký gửi (mỗi khách)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label htmlFor="adult-baggage-select" className="text-stone-600 block mb-1">
              Gói hành lý Người lớn:
            </label>
            <select
              id="adult-baggage-select"
              value={adultBaggage}
              onChange={(e) => setAdultBaggage(e.target.value as BaggageOption)}
              className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="none">Chỉ xách tay 7kg (Đã gồm trong vé)</option>
              <option value="checked_20kg">+20kg ký gửi (220.000đ/chặng)</option>
              <option value="checked_30kg">+30kg ký gửi (380.000đ/chặng)</option>
            </select>
          </div>
          {children > 0 && (
            <div>
              <label htmlFor="child-baggage-select" className="text-stone-600 block mb-1">
                Gói hành lý Trẻ em:
              </label>
              <select
                id="child-baggage-select"
                value={childBaggage}
                onChange={(e) => setChildBaggage(e.target.value as BaggageOption)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">Chỉ xách tay 7kg (Đã gồm trong vé)</option>
                <option value="checked_20kg">+20kg ký gửi (220.000đ/chặng)</option>
                <option value="checked_30kg">+30kg ký gửi (380.000đ/chặng)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Calculated Breakdown Display */}
      {groupFare && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-blue-100 pb-3">
            <div>
              <span className="text-xs text-stone-600 font-medium">Tổng giá trọn gói cho cả đoàn:</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                {formatVND(groupFare.totalPartyFare)}
              </div>
            </div>
            {isMultiTraveler && (
              <div className="text-xs text-stone-600 font-mono">
                Trung bình: <span className="font-bold text-stone-900">{formatVND(groupFare.perPersonAverageFare)}</span> / khách
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2">
              <span className="text-[11px] text-stone-500 block">Vé Người lớn:</span>
              <span className="font-bold font-mono text-stone-800">{formatVND(groupFare.adultSubtotal)}</span>
            </div>
            {children > 0 && (
              <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2">
                <span className="text-[11px] text-stone-500 block">Vé Trẻ em (75%):</span>
                <span className="font-bold font-mono text-stone-800">{formatVND(groupFare.childSubtotal)}</span>
              </div>
            )}
            {infants > 0 && (
              <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2">
                <span className="text-[11px] text-stone-500 block">Phí Em bé:</span>
                <span className="font-bold font-mono text-stone-800">{formatVND(groupFare.infantSubtotal)}</span>
              </div>
            )}
            <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2">
              <span className="text-[11px] text-stone-500 block">Thuế &amp; Phí sân bay:</span>
              <span className="font-bold font-mono text-stone-800">{formatVND(groupFare.passengerFacilityFeesSubtotal)}</span>
            </div>
            {groupFare.baggageSubtotal > 0 && (
              <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2">
                <span className="text-[11px] text-stone-500 block">Phí hành lý ký gửi:</span>
                <span className="font-bold font-mono text-stone-800">+{formatVND(groupFare.baggageSubtotal)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-stone-600 pt-2 border-t border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Nguyên tắc F40 &amp; F87: Farely công bố minh bạch toàn bộ chi phí theo đúng thành phần đoàn, không bao giờ dùng giá 1 người lớn để đại diện cho tổng chi phí cả gia đình.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
