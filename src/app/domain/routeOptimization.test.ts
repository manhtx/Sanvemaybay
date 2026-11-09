import { describe, expect, it } from "vitest";
import {
  assessRoute,
  chooseLowestCostRoute,
  combineSelfTransferOptions,
  RouteOption,
} from "./routeOptimization";

const direct: RouteOption = {
  type: "DIRECT",
  dataFresh: true,
  legs: [{
    origin: "HAN",
    destination: "ICN",
    price: 8_000_000,
    durationMinutes: 270,
    departureAt: "2026-10-12T01:00:00Z",
    arrivalAt: "2026-10-12T05:30:00Z",
    baggageIncluded: true,
  }],
};

describe("route optimization (FLY-INTEL-007, FLY-INTEL-008, NC-009, NC-010, NC-033)", () => {
  it("calculates total cost across legs and fees", () => {
    const result = assessRoute({
      type: "MULTI_LEG",
      dataFresh: true,
      legs: [
        { ...direct.legs[0], destination: "TPE", price: 2_000_000, extraCost: 300_000 },
        {
          ...direct.legs[0],
          origin: "TPE",
          destination: "ICN",
          price: 3_000_000,
          extraCost: 200_000,
          departureAt: "2026-10-12T08:00:00Z",
          arrivalAt: "2026-10-12T11:30:00Z",
        },
      ],
    });
    expect(result.totalCost).toBe(5_500_000);
    expect(result.totalDurationMinutes).toBe(540);
    expect(result.riskLevel).toBe("low");
  });

  it("evaluates safe direct flight with zero risks as low risk without requiring confirmation", () => {
    const result = assessRoute(direct);
    expect(result.totalCost).toBe(8_000_000);
    expect(result.totalDurationMinutes).toBe(270);
    expect(result.riskLevel).toBe("low");
    expect(result.riskReasons).toEqual([]);
    expect(result.requiresUserConfirmation).toBe(false);
  });

  it("requires confirmation for unsafe self-transfer options and escalates to high risk", () => {
    const result = assessRoute({
      type: "SELF_TRANSFER",
      requiresVisaTransit: true,
      airportChange: true,
      dataFresh: false,
      connectionMinutes: 90,
      legs: [
        { ...direct.legs[0], destination: "TPE", price: 1_000_000 },
        {
          ...direct.legs[0],
          origin: "TPE",
          destination: "ICN",
          price: 2_000_000,
          departureAt: "2026-10-12T07:00:00Z",
        },
      ],
    });
    expect(result.riskLevel).toBe("high");
    expect(result.requiresUserConfirmation).toBe(true);
    expect(result.riskReasons).toHaveLength(5);
    expect(result.riskReasons).toContain("Tách vé: hãng bay có thể không bảo vệ chặng tiếp theo.");
    expect(result.riskReasons).toContain("Thời gian nối chuyến dưới 120 phút.");
    expect(result.riskReasons).toContain("Cần xác minh visa transit.");
    expect(result.riskReasons).toContain("Phải đổi sân bay trong hành trình.");
    expect(result.riskReasons).toContain("Dữ liệu một hoặc nhiều chặng đã cũ.");
  });

  it("rejects a route with empty legs array (REQ-DOM-001)", () => {
    expect(() => assessRoute({
      type: "DIRECT",
      legs: [],
    })).toThrow("A route must contain at least one leg.");
  });

  it("rejects non-positive leg price and duration values (REQ-DOM-001)", () => {
    // calculateTotalCost fails closed first on negative price components
    expect(() => assessRoute({
      type: "DIRECT",
      legs: [{ ...direct.legs[0], price: -500_000 }],
    })).toThrow("Cost components must be finite and non-negative.");

    // leg duration <= 0 throws route leg values error
    expect(() => assessRoute({
      type: "DIRECT",
      legs: [{ ...direct.legs[0], durationMinutes: 0 }],
    })).toThrow("Route leg values are invalid.");

    expect(() => assessRoute({
      type: "DIRECT",
      legs: [{ ...direct.legs[0], durationMinutes: -60 }],
    })).toThrow("Route leg values are invalid.");
  });

  it("rejects malformed or unparseable timestamps in multi-leg connections (REQ-DOM-008)", () => {
    expect(() => assessRoute({
      type: "MULTI_LEG",
      legs: [
        { ...direct.legs[0], destination: "TPE" },
        { ...direct.legs[0], origin: "TPE", departureAt: "invalid-date-string" },
      ],
    })).toThrow("Invalid route time: invalid-date-string");

    expect(() => assessRoute({
      type: "MULTI_LEG",
      legs: [
        { ...direct.legs[0], destination: "TPE", arrivalAt: "bad-time" },
        { ...direct.legs[0], origin: "TPE", departureAt: "2026-10-12T08:00:00Z" },
      ],
    })).toThrow("Invalid route time: bad-time");
  });

  it("rejects a leg that departs before the prior leg arrives (temporal causality violation)", () => {
    expect(() => assessRoute({
      type: "MULTI_LEG",
      legs: [
        { ...direct.legs[0], destination: "TPE" },
        { ...direct.legs[0], origin: "TPE", departureAt: "2026-10-12T04:00:00Z" },
      ],
    })).toThrow("departs before the previous leg arrives");
  });

  it("does not mutate the supplied route while deriving a connection", () => {
    const route: RouteOption = {
      type: "MULTI_LEG",
      legs: [
        { ...direct.legs[0], destination: "TPE" },
        { ...direct.legs[0], origin: "TPE", departureAt: "2026-10-12T08:00:00Z" },
      ],
    };
    const result = assessRoute(route);
    expect(route.connectionMinutes).toBeUndefined();
    expect(result.option.connectionMinutes).toBe(150);
  });

  it("surfaces overnight and explicit airline reliability risk without inventing reliability", () => {
    const result = assessRoute({ ...direct, overnightTransit: true, airlineReliability: "unknown" });
    expect(result.riskReasons).toEqual(expect.arrayContaining([
      "Có transit qua đêm; cần kiểm tra nghỉ ngơi và giờ hoạt động sân bay.",
      "Chưa có dữ liệu độ tin cậy hãng bay.",
    ]));
    expect(result.riskLevel).toBe("medium");
  });

  it("distinguishes low airline reliability and unincluded baggage flags", () => {
    const result = assessRoute({
      ...direct,
      airlineReliability: "low",
      legs: [{ ...direct.legs[0], baggageIncluded: false }],
    });
    expect(result.riskReasons).toContain("Dữ liệu cho thấy độ tin cậy hãng bay thấp.");
    expect(result.riskReasons).toContain("Có chặng chưa bao gồm hành lý ký gửi.");
    expect(result.riskLevel).toBe("medium");
    expect(result.requiresUserConfirmation).toBe(false);
  });

  it("categorizes risk levels deterministically based on reason count", () => {
    // 0 reasons -> low
    const low = assessRoute(direct);
    expect(low.riskLevel).toBe("low");

    // 1 reason -> medium (e.g. overnightTransit)
    const med1 = assessRoute({ ...direct, overnightTransit: true });
    expect(med1.riskLevel).toBe("medium");

    // 2 reasons -> medium (e.g. overnightTransit + baggageNotIncluded)
    const med2 = assessRoute({
      ...direct,
      overnightTransit: true,
      legs: [{ ...direct.legs[0], baggageIncluded: false }],
    });
    expect(med2.riskLevel).toBe("medium");

    // 3 reasons -> high (overnight + no baggage + airline low)
    const high = assessRoute({
      ...direct,
      overnightTransit: true,
      airlineReliability: "low",
      legs: [{ ...direct.legs[0], baggageIncluded: false }],
    });
    expect(high.riskLevel).toBe("high");
    expect(high.requiresUserConfirmation).toBe(true);
  });

  it("chooses the cheapest route while excluding high-risk routes", () => {
    const risky: RouteOption = {
      type: "SELF_TRANSFER",
      requiresVisaTransit: true,
      airportChange: true,
      legs: [
        { ...direct.legs[0], price: 1_000_000 },
        { ...direct.legs[0], origin: "TPE", price: 1_000_000, departureAt: "2026-10-12T08:00:00Z" },
      ],
    };
    expect(chooseLowestCostRoute([direct, risky])?.option.type).toBe("DIRECT");
  });

  it("chooseLowestCostRoute returns undefined for empty input or when all options are high risk", () => {
    expect(chooseLowestCostRoute([])).toBeUndefined();

    const highRisk1: RouteOption = {
      type: "SELF_TRANSFER",
      requiresVisaTransit: true,
      airportChange: true,
      legs: [{ ...direct.legs[0] }],
    };
    const highRisk2: RouteOption = {
      type: "DIRECT",
      overnightTransit: true,
      airlineReliability: "low",
      legs: [{ ...direct.legs[0], baggageIncluded: false }],
    };
    expect(chooseLowestCostRoute([highRisk1, highRisk2])).toBeUndefined();
  });

  it("combines compatible observed options only when the self-transfer buffer is safe", () => {
    const first: RouteOption = {
      type: "DIRECT",
      dataFresh: true,
      legs: [{ ...direct.legs[0], destination: "TPE", arrivalAt: "2026-10-12T05:30:00Z" }],
    };
    const second: RouteOption = {
      type: "DIRECT",
      dataFresh: true,
      legs: [{
        ...direct.legs[0],
        origin: "TPE",
        destination: "ICN",
        price: 2_000_000,
        departureAt: "2026-10-12T08:00:00Z",
      }],
    };

    // Buffer 150 min >= 120 min default -> valid combination
    const combinations = combineSelfTransferOptions([first, second]);
    expect(combinations).toHaveLength(1);
    expect(combinations[0].type).toBe("SELF_TRANSFER");
    expect(combinations[0].connectionMinutes).toBe(150);
    expect(combinations[0].legs).toHaveLength(2);

    // Buffer 30 min < 120 min -> rejected
    expect(combineSelfTransferOptions([
      first,
      { ...second, legs: [{ ...second.legs[0], departureAt: "2026-10-12T06:00:00Z" }] },
    ])).toEqual([]);

    // Origin doesn't match previous destination -> rejected
    expect(combineSelfTransferOptions([
      first,
      { ...second, legs: [{ ...second.legs[0], origin: "NRT" }] },
    ])).toEqual([]);
  });

  it("combineSelfTransferOptions guards against invalid buffer arguments and self-combination", () => {
    const first: RouteOption = {
      type: "DIRECT",
      dataFresh: true,
      legs: [{ ...direct.legs[0], destination: "TPE", arrivalAt: "2026-10-12T05:30:00Z" }],
    };
    const second: RouteOption = {
      type: "DIRECT",
      dataFresh: true,
      legs: [{
        ...direct.legs[0],
        origin: "TPE",
        destination: "ICN",
        price: 2_000_000,
        departureAt: "2026-10-12T08:00:00Z",
      }],
    };

    expect(combineSelfTransferOptions([first, second], -60)).toEqual([]);
    expect(combineSelfTransferOptions([first, second], Number.NaN)).toEqual([]);
    expect(combineSelfTransferOptions([first])).toEqual([]);
  });

  it("combineSelfTransferOptions preserves risk metadata across legs", () => {
    const first: RouteOption = {
      type: "DIRECT",
      requiresVisaTransit: true,
      dataFresh: true,
      legs: [{ ...direct.legs[0], destination: "TPE", arrivalAt: "2026-10-12T05:30:00Z" }],
    };
    const second: RouteOption = {
      type: "DIRECT",
      airportChange: true,
      dataFresh: false,
      legs: [{
        ...direct.legs[0],
        origin: "TPE",
        destination: "ICN",
        departureAt: "2026-10-12T08:00:00Z",
      }],
    };

    const combined = combineSelfTransferOptions([first, second]);
    expect(combined).toHaveLength(1);
    expect(combined[0].requiresVisaTransit).toBe(true);
    expect(combined[0].airportChange).toBe(true);
    expect(combined[0].dataFresh).toBe(false);
  });
});
