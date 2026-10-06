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

  it("Negative Control: target-only Watch matches regardless of discount percentage", () => {
    const watch = {
      originCode: "HAN",
      destinationCode: "BKK",
      targetPrice: 4500000,
      status: "monitoring" as const,
    };

    const candidate = {
      originCode: "HAN",
      destinationCode: "BKK",
      price: 4200000, // Meets <= 4.5M target
    };

    expect(evaluateWatchMatch(watch, candidate)).toBe(true);
  });

  it("Negative Control: degrades status when last check was > 24 hours ago", () => {
    const staleCheck = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const status = computeWatchStatus({
      status: "active",
      lastCheckedAt: staleCheck,
      targetPrice: 5000000,
      latestPrice: 6000000,
    });
    expect(status).toBe("degraded");
    expect(formatWatchStatusLabel(status).label).toBe("THEO DÕI CHẬM");
  });

  it("evaluates metro location scopes: BKK_ALL matches BKK & DMK, exact BKK rejects DMK", () => {
    const metroWatch = {
      originCode: "HAN",
      destinationCode: "BKK_ALL",
      targetPrice: 5000000,
    };
    expect(evaluateWatchMatch(metroWatch, { originCode: "HAN", destinationCode: "BKK", price: 3000000 })).toBe(true);
    expect(evaluateWatchMatch(metroWatch, { originCode: "HAN", destinationCode: "DMK", price: 3000000 })).toBe(true);
    expect(evaluateWatchMatch(metroWatch, { originCode: "HAN", destinationCode: "SIN", price: 3000000 })).toBe(false);

    const exactWatch = {
      originCode: "HAN",
      destinationCode: "BKK",
      targetPrice: 5000000,
    };
    expect(evaluateWatchMatch(exactWatch, { originCode: "HAN", destinationCode: "BKK", price: 3000000 })).toBe(true);
    expect(evaluateWatchMatch(exactWatch, { originCode: "HAN", destinationCode: "DMK", price: 3000000 })).toBe(false);
  });

  it("evaluates TravelIntent roundtrip, return date, and cabin constraints", () => {
    const roundtripWatch = {
      originCode: "HAN",
      destinationCode: "SIN",
      tripType: "roundtrip" as const,
      returnDate: "2026-11-20",
      cabin: "economy" as const,
      targetPrice: 6000000,
    };
    // Exact match
    expect(evaluateWatchMatch(roundtripWatch, {
      originCode: "HAN", destinationCode: "SIN", price: 5000000, returnDate: "2026-11-20", cabin: "economy",
    })).toBe(true);

    // Mismatched return date
    expect(evaluateWatchMatch(roundtripWatch, {
      originCode: "HAN", destinationCode: "SIN", price: 5000000, returnDate: "2026-11-25", cabin: "economy",
    })).toBe(false);

    // Mismatched cabin
    expect(evaluateWatchMatch(roundtripWatch, {
      originCode: "HAN", destinationCode: "SIN", price: 5000000, returnDate: "2026-11-20", cabin: "business",
    })).toBe(false);

    // Missing return date on roundtrip
    expect(evaluateWatchMatch(roundtripWatch, {
      originCode: "HAN", destinationCode: "SIN", price: 5000000, returnDate: null, cabin: "economy",
    })).toBe(false);
  });

  it("Negative Control: condition episode exits to monitoring when price rises above target (no sticky stale match)", () => {
    const now = Date.now();
    const recentMatchTime = new Date(now - 30 * 60 * 1000).toISOString(); // 30 mins ago

    // Price has risen above target price -> MUST return monitoring, not matched!
    const statusAfterPriceRise = computeWatchStatus({
      status: "active",
      lastMatchAt: recentMatchTime,
      targetPrice: 4000000,
      latestPrice: 4800000, // Rose above 4M
    });

    expect(statusAfterPriceRise).toBe("monitoring");
  });
});

