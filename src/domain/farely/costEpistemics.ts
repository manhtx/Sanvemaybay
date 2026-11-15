/**
 * Farely Pure Domain Kernel — True Cost & Epistemics
 * REQ-COST-001, REQ-COST-002, REQ-COST-003, REQ-COST-004, REQ-COST-005, NC-033, NODE TK-08
 * One Semantic Authority for all cost epistemic evaluations.
 */

export type CostEpistemicState = 'KNOWN' | 'ESTIMATED' | 'OPTIONAL' | 'UNKNOWN';
export type CostEpistemicStatus = CostEpistemicState;

export interface CostComponent {
  category: 'fare' | 'taxes_fees' | 'checked_baggage' | 'carry_on' | 'seat_selection' | 'payment_fee';
  label: string;
  amount: number | null;
  state: CostEpistemicState;
  note?: string;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number | null;
  status: CostEpistemicStatus;
  mandatory: boolean;
  explanation: string;
}

export interface TrueCostEvaluation {
  basePrice: number;
  knownMandatoryTotal: number;
  estimatedMandatoryTotal: number;
  estimatedOptionalTotal: number;
  hasUnknownMandatoryCost: boolean;
  minVerifiableTotal: number;
  itemizedFees: FeeItem[];
  pricingTransparencyDisclaimer: string;

  // Unified compatibility fields for UI and legacy tests
  components: CostComponent[];
  knownTotal: number;
  estimatedAdditional: number;
  estimatedTotal: number;
  hasUnknownMandatory: boolean;
  totalLabel: string;
  isBaggageIncluded: boolean;
  baggageState: CostEpistemicState;
}

export interface TrueCostInput {
  basePrice: number;
  airline?: string;
  airlineCode?: string;
  isInternational?: boolean;
  region?: string;
  providedHiddenCosts?:
    | {
        baggageFee?: number;
        paymentFee?: number;
        airportTaxes?: number;
      }
    | Array<{ label: string; amount: number; note?: string }>;
  providerVerifiedAllIn?: boolean;
  isBaggageExplicitlyIncluded?: boolean;
}

const BUDGET_CARRIER_CODES = new Set(['VJ', 'AK', 'FD', 'TR', '5J', 'SL', 'VU']);
const LEGACY_CARRIER_CODES = new Set([
  'VN', 'QH', 'SQ', 'TG', 'JL', 'NH', 'KE', 'OZ', 'CX', 'BR', 'CI', 'EK', 'QR', 'TK'
]);

const DISCLAIMER_UNKNOWN = 'Giá vé cơ bản có thể chưa bao gồm đầy đủ phụ phí xuất vé hoặc thuế địa phương tuỳ kênh đặt vé.';
const DISCLAIMER_CONFIRMED = 'Giá hiển thị đã xác nhận bao gồm thuế và các loại phí bắt buộc.';

const SEAT_SELECTION_COMPONENT: CostComponent = Object.freeze({
  category: 'seat_selection',
  label: 'Chọn chỗ ngồi',
  amount: null,
  state: 'OPTIONAL',
  note: 'Không bắt buộc; tùy chọn thêm tại bước làm thủ tục'
});

const BAGGAGE_INCLUDED_FEE: FeeItem = Object.freeze({
  id: 'baggage_fee',
  name: 'Hành lý ký gửi 20kg',
  amount: 0,
  status: 'KNOWN',
  mandatory: false,
  explanation: 'Đã xác nhận bao gồm trong giá vé'
});

const BAGGAGE_INCLUDED_COMPONENT: CostComponent = Object.freeze({
  category: 'checked_baggage',
  label: 'Hành lý ký gửi',
  amount: 0,
  state: 'KNOWN',
  note: 'Đã xác nhận bao gồm trong giá vé'
});

const BAGGAGE_BUDGET_DOM_FEE: FeeItem = Object.freeze({
  id: 'baggage_fee',
  name: 'Hành lý ký gửi 20kg (Ước tính)',
  amount: 280000,
  status: 'ESTIMATED',
  mandatory: false,
  explanation: 'Hãng giá rẻ thường không bao gồm hành lý ký gửi'
});

const BAGGAGE_BUDGET_DOM_COMPONENT: CostComponent = Object.freeze({
  category: 'checked_baggage',
  label: 'Hành lý ký gửi 20kg (ước tính)',
  amount: 280000,
  state: 'ESTIMATED',
  note: 'Hãng bay giá rẻ thường chưa bao gồm kiện ký gửi tiêu chuẩn'
});

const BAGGAGE_BUDGET_INTL_FEE: FeeItem = Object.freeze({
  id: 'baggage_fee',
  name: 'Hành lý ký gửi 20kg (Ước tính)',
  amount: 450000,
  status: 'ESTIMATED',
  mandatory: false,
  explanation: 'Hãng giá rẻ thường không bao gồm hành lý ký gửi'
});

const BAGGAGE_BUDGET_INTL_COMPONENT: CostComponent = Object.freeze({
  category: 'checked_baggage',
  label: 'Hành lý ký gửi 20kg (ước tính)',
  amount: 450000,
  state: 'ESTIMATED',
  note: 'Hãng bay giá rẻ thường chưa bao gồm kiện ký gửi tiêu chuẩn'
});

const BAGGAGE_LEGACY_FEE: FeeItem = Object.freeze({
  id: 'baggage_fee',
  name: 'Hành lý ký gửi',
  amount: null,
  status: 'UNKNOWN',
  mandatory: false,
  explanation: 'Tùy hạng vé của hãng (hạng Tiết kiệm/Lite có thể chưa bao gồm kiện ký gửi)'
});

const BAGGAGE_LEGACY_COMPONENT: CostComponent = Object.freeze({
  category: 'checked_baggage',
  label: 'Hành lý ký gửi',
  amount: null,
  state: 'UNKNOWN',
  note: 'Tùy hạng vé của hãng (hạng Tiết kiệm/Lite có thể chưa bao gồm kiện ký gửi)'
});

const BAGGAGE_UNKNOWN_FEE: FeeItem = Object.freeze({
  id: 'baggage_fee',
  name: 'Hành lý ký gửi',
  amount: null,
  status: 'UNKNOWN',
  mandatory: false,
  explanation: 'Chưa có thông tin kiện ký gửi từ nhà cung cấp — cần kiểm tra khi đặt'
});

const BAGGAGE_UNKNOWN_COMPONENT: CostComponent = Object.freeze({
  category: 'checked_baggage',
  label: 'Hành lý ký gửi',
  amount: null,
  state: 'UNKNOWN',
  note: 'Chưa có thông tin kiện ký gửi từ nhà cung cấp — cần kiểm tra khi đặt'
});

const TAXES_ALL_IN_FEE: FeeItem = Object.freeze({
  id: 'taxes_and_fees',
  name: 'Thuế & phí sân bay',
  amount: 0,
  status: 'KNOWN',
  mandatory: true,
  explanation: 'Đã bao gồm trong giá vé quan sát theo hợp đồng nhà cung cấp'
});

const TAXES_ALL_IN_COMPONENT: CostComponent = Object.freeze({
  category: 'taxes_fees',
  label: 'Thuế & phụ phí sân bay',
  amount: 0,
  state: 'KNOWN',
  note: 'Đã bao gồm trong giá vé quan sát theo nhà cung cấp'
});

const TAXES_UNKNOWN_FEE: FeeItem = Object.freeze({
  id: 'taxes_and_fees',
  name: 'Thuế & phụ phí sân bay',
  amount: null,
  status: 'UNKNOWN',
  mandatory: true,
  explanation: 'Chưa có dữ liệu xác nhận thuế phí đã bao gồm hoàn toàn trong giá hiển thị hay chưa'
});

const PAYMENT_UNKNOWN_FEE: FeeItem = Object.freeze({
  id: 'payment_fee',
  name: 'Phí thanh toán',
  amount: null,
  status: 'UNKNOWN',
  mandatory: true,
  explanation: 'Tùy phương thức thanh toán (thẻ quốc tế / thẻ nội địa)'
});

const PAYMENT_UNKNOWN_COMPONENT: CostComponent = Object.freeze({
  category: 'payment_fee',
  label: 'Phụ phí thanh toán',
  amount: null,
  state: 'UNKNOWN',
  note: 'Tùy phương thức thanh toán (thẻ quốc tế / thẻ nội địa)'
});

function isBudgetCarrier(carrier: string): boolean {
  if (BUDGET_CARRIER_CODES.has(carrier)) return true;
  if (carrier.length >= 4) {
    if (carrier.includes('AIRASIA') || carrier.includes('SCOOT')) return true;
  }
  return carrier.includes('VJ') || carrier.includes('VU');
}

/**
 * Evaluates the true all-in cost with epistemic honesty.
 * Invariants:
 * - REQ-COST-001: providedHiddenCosts are actually consumed.
 * - REQ-COST-002: Clearly separates KNOWN, ESTIMATED, OPTIONAL, UNKNOWN.
 * - REQ-COST-003 / NC-033: Unknown mandatory cost != zero.
 * - REQ-COST-004: Heuristic baggage estimate is marked ESTIMATED/OPTIONAL, not "real total".
 * - REQ-COST-005: No universal "taxes included" claim without provider verification.
 * - NODE TK-08: Unified single authority across domain kernel and consumer components.
 */
export function evaluateTrueCost(params: TrueCostInput): TrueCostEvaluation {
  const carrier = (params.airline || params.airlineCode || '').trim().toUpperCase();
  const isInternational =
    params.isInternational ??
    (params.region === 'international' || params.region === 'asia' || params.region === 'europe' || params.region === 'americas');

  // Normalize provided hidden costs
  let baggageFeeProvided: number | undefined;
  let paymentFeeProvided: number | undefined;
  let airportTaxesProvided: number | undefined;

  if (params.providedHiddenCosts) {
    if (Array.isArray(params.providedHiddenCosts)) {
      for (const item of params.providedHiddenCosts) {
        const label = item.label.toLowerCase();
        if (label.includes('hành lý') || label.includes('baggage')) {
          baggageFeeProvided = item.amount;
        } else if (label.includes('thanh toán') || label.includes('payment')) {
          paymentFeeProvided = item.amount;
        } else if (label.includes('thuế') || label.includes('tax')) {
          airportTaxesProvided = item.amount;
        }
      }
    } else {
      baggageFeeProvided = params.providedHiddenCosts.baggageFee;
      paymentFeeProvided = params.providedHiddenCosts.paymentFee;
      airportTaxesProvided = params.providedHiddenCosts.airportTaxes;
    }
  }

  const fees: FeeItem[] = [];
  const components: CostComponent[] = [];

  // 1. Base Fare - Known
  components.push({
    category: 'fare',
    label: 'Giá vé quan sát',
    amount: params.basePrice,
    state: 'KNOWN',
    note: 'Giá vé ghi nhận từ đợt quét'
  });

  // 2. Baggage fee evaluation
  let baggageState: CostEpistemicState = 'UNKNOWN';
  let isBaggageIncluded = false;

  if (params.isBaggageExplicitlyIncluded) {
    baggageState = 'KNOWN';
    isBaggageIncluded = true;
    fees.push(BAGGAGE_INCLUDED_FEE);
    components.push(BAGGAGE_INCLUDED_COMPONENT);
  } else if (baggageFeeProvided !== undefined) {
    baggageState = 'KNOWN';
    fees.push({
      id: 'baggage_fee',
      name: 'Hành lý ký gửi 20kg',
      amount: baggageFeeProvided,
      status: 'KNOWN',
      mandatory: false,
      explanation: 'Chi phí hành lý ký gửi do nguồn cung cấp'
    });
    components.push({
      category: 'checked_baggage',
      label: 'Hành lý ký gửi',
      amount: baggageFeeProvided,
      state: 'KNOWN',
      note: 'Dữ liệu phí hành lý do nhà cung cấp báo'
    });
  } else {
    const isBudget = isBudgetCarrier(carrier);
    const isLegacy = LEGACY_CARRIER_CODES.has(carrier);

    if (isBudget) {
      baggageState = 'ESTIMATED';
      fees.push(isInternational ? BAGGAGE_BUDGET_INTL_FEE : BAGGAGE_BUDGET_DOM_FEE);
      components.push(isInternational ? BAGGAGE_BUDGET_INTL_COMPONENT : BAGGAGE_BUDGET_DOM_COMPONENT);
    } else if (isLegacy) {
      // Negative control: Carrier identity alone is insufficient to mark baggage KNOWN
      baggageState = 'UNKNOWN';
      fees.push(BAGGAGE_LEGACY_FEE);
      components.push(BAGGAGE_LEGACY_COMPONENT);
    } else {
      baggageState = 'UNKNOWN';
      fees.push(BAGGAGE_UNKNOWN_FEE);
      components.push(BAGGAGE_UNKNOWN_COMPONENT);
    }
  }

  // 3. Airport taxes & mandatory fees
  if (airportTaxesProvided !== undefined) {
    fees.push({
      id: 'taxes_and_fees',
      name: 'Thuế & phí sân bay',
      amount: airportTaxesProvided,
      status: 'KNOWN',
      mandatory: true,
      explanation: 'Thuế và phụ phí sân bay đã xác nhận'
    });
    components.push({
      category: 'taxes_fees',
      label: 'Thuế & phụ phí sân bay',
      amount: airportTaxesProvided,
      state: 'KNOWN',
      note: 'Thuế và phụ phí sân bay đã xác nhận'
    });
  } else if (params.providerVerifiedAllIn) {
    fees.push(TAXES_ALL_IN_FEE);
    components.push(TAXES_ALL_IN_COMPONENT);
  } else {
    // REQ-COST-003 / NC-033: Unknown mandatory cost is UNKNOWN, not zero
    fees.push(TAXES_UNKNOWN_FEE);
  }

  // 4. Seat selection (Optional)
  components.push(SEAT_SELECTION_COMPONENT);

  // 5. Payment fee
  if (paymentFeeProvided !== undefined) {
    fees.push({
      id: 'payment_fee',
      name: 'Phí thanh toán',
      amount: paymentFeeProvided,
      status: 'KNOWN',
      mandatory: false,
      explanation: 'Phí xử lý giao dịch'
    });
    components.push({
      category: 'payment_fee',
      label: 'Phụ phí thanh toán',
      amount: paymentFeeProvided,
      state: 'KNOWN',
      note: 'Phí xử lý giao dịch'
    });
  } else {
    fees.push(PAYMENT_UNKNOWN_FEE);
    components.push(PAYMENT_UNKNOWN_COMPONENT);
  }

  let knownMandatory = 0;
  let estimatedMandatory = 0;
  let estimatedOptional = 0;
  let hasUnknownMandatoryCost = false;

  for (let i = 0; i < fees.length; i++) {
    const fee = fees[i];
    if (fee.mandatory) {
      if (fee.status === 'KNOWN' && fee.amount !== null) {
        knownMandatory += fee.amount;
      } else if (fee.status === 'ESTIMATED' && fee.amount !== null) {
        estimatedMandatory += fee.amount;
      } else if (fee.status === 'UNKNOWN') {
        hasUnknownMandatoryCost = true;
      }
    } else if (fee.amount !== null) {
      estimatedOptional += fee.amount;
    }
  }

  let knownTotal = 0;
  let estimatedAdditional = 0;
  let hasUnknownMandatoryComp = false;

  for (let i = 0; i < components.length; i++) {
    const c = components[i];
    if (c.state === 'KNOWN' && c.amount !== null) {
      knownTotal += c.amount;
    } else if (c.state === 'ESTIMATED' && c.amount !== null) {
      estimatedAdditional += c.amount;
    }
    if (!hasUnknownMandatoryComp && c.state === 'UNKNOWN' && (c.category === 'payment_fee' || c.category === 'checked_baggage' || c.category === 'taxes_fees')) {
      hasUnknownMandatoryComp = true;
    }
  }

  const estimatedTotal = knownTotal + estimatedAdditional;
  const hasUnknownMandatory = hasUnknownMandatoryComp || hasUnknownMandatoryCost;

  return {
    basePrice: params.basePrice,
    knownMandatoryTotal: knownMandatory,
    estimatedMandatoryTotal: estimatedMandatory,
    estimatedOptionalTotal: estimatedOptional,
    hasUnknownMandatoryCost,
    minVerifiableTotal: params.basePrice + knownMandatory,
    itemizedFees: fees,
    pricingTransparencyDisclaimer: hasUnknownMandatoryCost ? DISCLAIMER_UNKNOWN : DISCLAIMER_CONFIRMED,
    components,
    knownTotal,
    estimatedAdditional,
    estimatedTotal,
    hasUnknownMandatory,
    totalLabel: hasUnknownMandatory ? 'Tổng ước tính' : 'Tổng chi phí',
    isBaggageIncluded,
    baggageState
  };
}
