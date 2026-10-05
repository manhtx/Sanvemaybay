import { describe, expect, it } from "vitest";
import { computeWatchStatus, evaluateWatchMatch, formatWatchStatusLabel, WatchIntent } from "./watch";

describe("Watch Domain", () => {
  it("evaluates matching route and target price correctly", () => {
    const watch: Pick<WatchIntent, "originCode" | "destinationCode" | "targetPrice" | "status" | "dateFrom" | "dateTo"> = {
      originCode: "HAN",
      destinationCode: "BKK",
      targetPrice: 3000000,
      status: "monitoring",
    };

    expect(evaluateWatchMatch(watch, {
      originCode: "HAN",
      destinationCode: "BKK",
      price: 2500000,
    })).toBe(true);

    expect(evaluateWatchMatch(watch, {
      originCode: "HAN",
      destinationCode: "BKK",
      price: 3500000,
    })).toBe(false);

    expect(evaluateWatchMatch(watch, {
      originCode: "SGN",
      destinationCode: "BKK",
      price: 2500000,
    })).toBe(false);
  });

  it("handles stops and date bounds", () => {
    const watch = {
      originCode: "HAN",
      destinationCode: "NRT",
      targetPrice: 10000000,
      maxStops: 0,
      dateFrom: "2026-11-01",
      dateTo: "2026-11-15",
      status: "monitoring" as const,
    };

    expect(evaluateWatchMatch(watch, {
      originCode: "HAN",
      destinationCode: "NRT",
      price: 8000000,
      stops: 1,
      departDate: "2026-11-05",
    })).toBe(false); // Max stops exceeded

    expect(evaluateWatchMatch(watch, {
      originCode: "HAN",
      destinationCode: "NRT",
      price: 8000000,
      stops: 0,
      departDate: "2026-11-20",
    })).toBe(false); // After dateTo

    expect(evaluateWatchMatch(watch, {
      originCode: "HAN",
      destinationCode: "NRT",
      price: 8000000,
      stops: 0,
      departDate: "2026-11-05",
    })).toBe(true);
  });

  it("does not match when paused or expired", () => {
    expect(evaluateWatchMatch({
      originCode: "HAN",
      destinationCode: "BKK",
      status: "paused",
    }, { originCode: "HAN", destinationCode: "BKK", price: 1000000 })).toBe(false);

    expect(evaluateWatchMatch({
      originCode: "HAN",
      destinationCode: "BKK",
      status: "expired",
    }, { originCode: "HAN", destinationCode: "BKK", price: 1000000 })).toBe(false);
  });

  it("computes lifecycle states", () => {
    expect(computeWatchStatus({ status: "paused" })).toBe("paused");

    expect(computeWatchStatus({
      status: "active",
      targetPrice: 5000000,
      latestPrice: 4500000,
    })).toBe("matched");

    expect(computeWatchStatus({
      status: "active",
      targetPrice: 5000000,
      latestPrice: 5500000,
    })).toBe("monitoring");

    expect(computeWatchStatus({
      status: "active",
      dateTo: "2020-01-01",
    })).toBe("expired");
  });

  it("provides human-readable status labels", () => {
    const monitoring = formatWatchStatusLabel("monitoring");
    expect(monitoring.label).toBe("ĐANG THEO DÕI");
    const matched = formatWatchStatusLabel("matched");
    expect(matched.label).toBe("ĐÃ CÓ MỨC GIÁ MỤC TIÊU");
  });

  it("Negative Control: matches observed Opportunity when legacy deals count is 0", () => {
    const legacyDealsCount = 0;
    const observedCandidate = {
      originCode: "HAN",
      destinationCode: "BKK",
      price: 4570000,
      stops: 0,
      departDate: "2026-10-19",
    };

    const watch: Pick<WatchIntent, "originCode" | "destinationCode" | "targetPrice" | "status" | "dateFrom" | "dateTo" | "maxStops"> = {
      originCode: "HAN",
      destinationCode: "BKK",
      targetPrice: 4600000,
      status: "monitoring",
      maxStops: 0,
    };

    // Even if legacyDealsCount === 0, the observed opportunity candidate must match
    expect(legacyDealsCount).toBe(0);
    const matches = evaluateWatchMatch(watch, observedCandidate);
    expect(matches).toBe(true);
  });
});
