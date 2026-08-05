import { describe, expect, it } from "vitest";
import { assessRoute, chooseLowestCostRoute, combineSelfTransferOptions, RouteOption } from "./routeOptimization";

const direct: RouteOption = {
  type: "DIRECT",
  dataFresh: true,
  legs: [{
    origin: "HAN", destination: "ICN", price: 8_000_000, durationMinutes: 270,
    departureAt: "2026-10-12T01:00:00Z", arrivalAt: "2026-10-12T05:30:00Z", baggageIncluded: true,
  }],
};

describe("route optimization", () => {
  it("calculates total cost across legs and fees", () => {
    const result = assessRoute({
      type: "MULTI_LEG",
      dataFresh: true,
      legs: [
        { ...direct.legs[0], destination: "TPE", price: 2_000_000, extraCost: 300_000 },
        { ...direct.legs[0], origin: "TPE", destination: "ICN", price: 3_000_000, extraCost: 200_000,
          departureAt: "2026-10-12T08:00:00Z", arrivalAt: "2026-10-12T11:30:00Z" },
      ],
    });
    expect(result.totalCost).toBe(5_500_000);
    expect(result.riskLevel).toBe("low");
  });

  it("requires confirmation for unsafe self-transfer options", () => {
    const result = assessRoute({
      type: "SELF_TRANSFER",
      requiresVisaTransit: true,
      airportChange: true,
      dataFresh: false,
      connectionMinutes: 90,
      legs: [
        { ...direct.legs[0], destination: "TPE", price: 1_000_000 },
        { ...direct.legs[0], origin: "TPE", destination: "ICN", price: 2_000_000,
          departureAt: "2026-10-12T07:00:00Z" },
      ],
    });
    expect(result.riskLevel).toBe("high");
    expect(result.requiresUserConfirmation).toBe(true);
    expect(result.riskReasons).toHaveLength(5);
  });

  it("rejects a leg that departs before the prior leg arrives", () => {
    expect(() => assessRoute({
      type: "MULTI_LEG",
      legs: [
        { ...direct.legs[0], destination: "TPE" },
        { ...direct.legs[0], origin: "TPE", departureAt: "2026-10-12T04:00:00Z" },
      ],
    })).toThrow("departs before");
  });

  it("chooses the cheapest route while excluding high-risk routes", () => {
    const risky: RouteOption = {
      type: "SELF_TRANSFER", requiresVisaTransit: true, airportChange: true,
      legs: [{ ...direct.legs[0], price: 1_000_000 }, { ...direct.legs[0], origin: "TPE", price: 1_000_000,
        departureAt: "2026-10-12T08:00:00Z" }],
    };
    expect(chooseLowestCostRoute([direct, risky])?.option.type).toBe("DIRECT");
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

  it("combines compatible observed options only when the self-transfer buffer is safe", () => {
    const first: RouteOption = { type: "DIRECT", dataFresh: true, legs: [{ ...direct.legs[0], destination: "TPE", arrivalAt: "2026-10-12T05:30:00Z" }] };
    const second: RouteOption = { type: "DIRECT", dataFresh: true, legs: [{ ...direct.legs[0], origin: "TPE", destination: "ICN", price: 2_000_000, departureAt: "2026-10-12T08:00:00Z" }] };
    expect(combineSelfTransferOptions([first, second])).toHaveLength(1);
    expect(combineSelfTransferOptions([first, { ...second, legs: [{ ...second.legs[0], departureAt: "2026-10-12T06:00:00Z" }] }])).toEqual([]);
    expect(combineSelfTransferOptions([first, { ...second, legs: [{ ...second.legs[0], origin: "NRT" }] }])).toEqual([]);
  });

  it("surfaces overnight and explicit airline reliability risk without inventing reliability", () => {
    const result = assessRoute({ ...direct, overnightTransit: true, airlineReliability: "unknown" });
    expect(result.riskReasons).toEqual(expect.arrayContaining([
      "Có transit qua đêm; cần kiểm tra nghỉ ngơi và giờ hoạt động sân bay.",
      "Chưa có dữ liệu độ tin cậy hãng bay.",
    ]));
    expect(result.riskLevel).toBe("medium");
  });
});
