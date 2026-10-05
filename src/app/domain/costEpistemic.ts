export type CostEpistemicState = "KNOWN" | "ESTIMATED" | "OPTIONAL" | "UNKNOWN";

export interface CostComponent {
  category: "fare" | "taxes_fees" | "checked_baggage" | "carry_on" | "seat_selection" | "payment_fee";
  label: string;
  amount: number | null;
  state: CostEpistemicState;
  note?: string;
}

export interface TrueCostEvaluation {
  components: CostComponent[];
  knownTotal: number;
  estimatedAdditional: number;
  estimatedTotal: number;
  hasUnknownMandatory: boolean;
  totalLabel: string; // "Tổng ước tính", never "Tổng thực tế phải trả" when unknown mandatory costs exist
  isBaggageIncluded: boolean;
  baggageState: CostEpistemicState;
}

export function evaluateTrueCost(input: {
  basePrice: number;
  airlineCode?: string;
  region?: string;
  providedHiddenCosts?: Array<{ label: string; amount: number; note?: string }>;
  isBaggageExplicitlyIncluded?: boolean;
}): TrueCostEvaluation {
  const components: CostComponent[] = [];

  // 1. Base Fare - Known
  components.push({
    category: "fare",
    label: "Giá vé quan sát",
    amount: input.basePrice,
    state: "KNOWN",
    note: "Giá vé ghi nhận từ đợt quét",
  });

  const isBudget = ["VJ", "AK", "FD", "TR", "5J", "SL"].includes(String(input.airlineCode || "").toUpperCase());
  const isLegacy = ["VN", "QH", "SQ", "TG", "JL", "NH", "KE", "OZ", "CX", "BR", "CI", "EK", "QR", "TK"].includes(String(input.airlineCode || "").toUpperCase());

  // 2. Checked Baggage
  let baggageState: CostEpistemicState = "UNKNOWN";
  let baggageAmount: number | null = null;
  let isBaggageIncluded = false;

  if (input.isBaggageExplicitlyIncluded) {
    baggageState = "KNOWN";
    baggageAmount = 0;
    isBaggageIncluded = true;
    components.push({
      category: "checked_baggage",
      label: "Hành lý ký gửi",
      amount: 0,
      state: "KNOWN",
      note: "Đã xác nhận bao gồm trong giá vé",
    });
  } else if (isBudget) {
    baggageState = "ESTIMATED";
    baggageAmount = input.region === "domestic" ? 280000 : 550000;
    components.push({
      category: "checked_baggage",
      label: "Hành lý ký gửi 20kg (ước tính)",
      amount: baggageAmount,
      state: "ESTIMATED",
      note: "Hãng bay giá rẻ thường chưa bao gồm kiện ký gửi tiêu chuẩn",
    });
  } else if (isLegacy) {
    baggageState = "KNOWN";
    baggageAmount = 0;
    isBaggageIncluded = true;
    components.push({
      category: "checked_baggage",
      label: "Hành lý ký gửi",
      amount: 0,
      state: "KNOWN",
      note: "Hãng truyền thống tiêu chuẩn đã bao gồm kiện ký gửi",
    });
  } else {
    // Negative control: No baggage info -> UNKNOWN -> NEVER "included"
    baggageState = "UNKNOWN";
    baggageAmount = null;
    components.push({
      category: "checked_baggage",
      label: "Hành lý ký gửi",
      amount: null,
      state: "UNKNOWN",
      note: "Chưa có thông tin kiện ký gửi từ nhà cung cấp — cần kiểm tra khi đặt",
    });
  }

  // 3. Seat selection - Optional
  components.push({
    category: "seat_selection",
    label: "Chọn chỗ ngồi",
    amount: null,
    state: "OPTIONAL",
    note: "Không bắt buộc; tùy chọn thêm tại bước làm thủ tục",
  });

  // 4. Payment fee - Unknown
  components.push({
    category: "payment_fee",
    label: "Phụ phí thanh toán",
    amount: null,
    state: "UNKNOWN",
    note: "Tùy phương thức thanh toán (thẻ quốc tế / thẻ nội địa)",
  });

  const knownTotal = components
    .filter((c) => c.state === "KNOWN" && c.amount !== null)
    .reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const estimatedAdditional = components
    .filter((c) => c.state === "ESTIMATED" && c.amount !== null)
    .reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const estimatedTotal = knownTotal + estimatedAdditional;

  const hasUnknownMandatory = components.some(
    (c) => c.state === "UNKNOWN" && (c.category === "payment_fee" || c.category === "checked_baggage"),
  );

  return {
    components,
    knownTotal,
    estimatedAdditional,
    estimatedTotal,
    hasUnknownMandatory,
    totalLabel: hasUnknownMandatory ? "Tổng ước tính" : "Tổng chi phí",
    isBaggageIncluded,
    baggageState,
  };
}
