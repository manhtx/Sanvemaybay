/**
 * Farely Pure Domain Kernel — True Cost & Epistemics
 * REQ-COST-001, REQ-COST-002, REQ-COST-003, REQ-COST-004, REQ-COST-005, NC-033
 */

export type CostEpistemicStatus = 'KNOWN' | 'ESTIMATED' | 'OPTIONAL' | 'UNKNOWN';

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
}

/**
 * Evaluates the true all-in cost with epistemic honesty.
 * Invariants:
 * - REQ-COST-001: providedHiddenCosts are actually consumed.
 * - REQ-COST-002: Clearly separates KNOWN, ESTIMATED, OPTIONAL, UNKNOWN.
 * - REQ-COST-003 / NC-033: Unknown mandatory cost != zero.
 * - REQ-COST-004: Heuristic baggage estimate is marked ESTIMATED/OPTIONAL, not "real total".
 * - REQ-COST-005: No universal "taxes included" claim without provider verification.
 */
export function evaluateTrueCost(params: {
  basePrice: number;
  airline: string;
  isInternational: boolean;
  providedHiddenCosts?: {
    baggageFee?: number;
    paymentFee?: number;
    airportTaxes?: number;
  };
  providerVerifiedAllIn?: boolean;
}): TrueCostEvaluation {
  const fees: FeeItem[] = [];

  // 1. Baggage fee
  if (params.providedHiddenCosts?.baggageFee !== undefined) {
    fees.push({
      id: 'baggage_fee',
      name: 'Hành lý ký gửi 20kg',
      amount: params.providedHiddenCosts.baggageFee,
      status: 'KNOWN',
      mandatory: false,
      explanation: 'Chi phí hành lý ký gửi do nguồn cung cấp'
    });
  } else {
    // Standard LCC estimate
    const isLcc = ['VJ', 'VU', 'AIRASIA', 'SCOOT'].some(a => params.airline.toUpperCase().includes(a));
    if (isLcc) {
      fees.push({
        id: 'baggage_fee',
        name: 'Hành lý ký gửi 20kg (Ước tính)',
        amount: params.isInternational ? 450000 : 250000,
        status: 'ESTIMATED',
        mandatory: false,
        explanation: 'Hãng giá rẻ thường không bao gồm hành lý ký gửi'
      });
    } else {
      fees.push({
        id: 'baggage_fee',
        name: 'Hành lý ký gửi (Theo tiêu chuẩn vé)',
        amount: 0,
        status: 'KNOWN',
        mandatory: false,
        explanation: 'Bao gồm theo hạng vé tiêu chuẩn của hãng truyền thống'
      });
    }
  }

  // 2. Airport taxes & mandatory fees
  if (params.providedHiddenCosts?.airportTaxes !== undefined) {
    fees.push({
      id: 'taxes_and_fees',
      name: 'Thuế & phí sân bay',
      amount: params.providedHiddenCosts.airportTaxes,
      status: 'KNOWN',
      mandatory: true,
      explanation: 'Thuế và phụ phí sân bay đã xác nhận'
    });
  } else if (params.providerVerifiedAllIn) {
    fees.push({
      id: 'taxes_and_fees',
      name: 'Thuế & phí sân bay',
      amount: 0,
      status: 'KNOWN',
      mandatory: true,
      explanation: 'Đã bao gồm trong giá vé quan sát theo hợp đồng nhà cung cấp'
    });
  } else {
    // REQ-COST-003 / NC-033: Unknown mandatory cost is UNKNOWN, not zero
    fees.push({
      id: 'taxes_and_fees',
      name: 'Thuế & phụ phí sân bay',
      amount: null,
      status: 'UNKNOWN',
      mandatory: true,
      explanation: 'Chưa có dữ liệu xác nhận thuế phí đã bao gồm hoàn toàn trong giá hiển thị hay chưa'
    });
  }

  // 3. Payment fee
  if (params.providedHiddenCosts?.paymentFee !== undefined) {
    fees.push({
      id: 'payment_fee',
      name: 'Phí thanh toán',
      amount: params.providedHiddenCosts.paymentFee,
      status: 'KNOWN',
      mandatory: false,
      explanation: 'Phí xử lý giao dịch'
    });
  }

  let knownMandatory = 0;
  let estimatedMandatory = 0;
  let estimatedOptional = 0;
  let hasUnknownMandatory = false;

  for (const fee of fees) {
    if (fee.mandatory) {
      if (fee.status === 'KNOWN' && fee.amount !== null) {
        knownMandatory += fee.amount;
      } else if (fee.status === 'ESTIMATED' && fee.amount !== null) {
        estimatedMandatory += fee.amount;
      } else if (fee.status === 'UNKNOWN') {
        hasUnknownMandatory = true;
      }
    } else {
      if (fee.amount !== null) {
        estimatedOptional += fee.amount;
      }
    }
  }

  return {
    basePrice: params.basePrice,
    knownMandatoryTotal: knownMandatory,
    estimatedMandatoryTotal: estimatedMandatory,
    estimatedOptionalTotal: estimatedOptional,
    hasUnknownMandatoryCost: hasUnknownMandatory,
    minVerifiableTotal: params.basePrice + knownMandatory,
    itemizedFees: fees,
    pricingTransparencyDisclaimer: hasUnknownMandatory
      ? 'Giá vé cơ bản có thể chưa bao gồm đầy đủ phụ phí xuất vé hoặc thuế địa phương tuỳ kênh đặt vé.'
      : 'Giá hiển thị đã xác nhận bao gồm thuế và các loại phí bắt buộc.'
  };
}
