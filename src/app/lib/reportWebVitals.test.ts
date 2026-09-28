import { describe, expect, it } from "vitest";
import {
  CURRENT_CORE_WEB_VITALS,
  DIAGNOSTIC_WEB_VITALS,
  isCurrentCoreWebVital,
  isDeprecatedWebVital,
  shouldSampleWebVitals,
} from "./reportWebVitals";

function storage(): Storage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), clear: () => values.clear(), key: () => null, length: 0 };
}

describe("shouldSampleWebVitals", () => {
  it("uses one stable privacy-preserving decision per session", () => {
    const store = storage();
    expect(shouldSampleWebVitals(0.25, store, () => 0.1)).toBe(true);
    expect(shouldSampleWebVitals(0.25, store, () => 0.9)).toBe(true);
  });

  it("bounds invalid sampling configuration", () => {
    expect(shouldSampleWebVitals(-1, storage(), () => 0)).toBe(false);
    expect(shouldSampleWebVitals(2, storage(), () => 0.999)).toBe(true);
  });
});

describe("Core Web Vitals metric standards", () => {
  it("enforces LCP, INP, CLS as current Core Web Vitals", () => {
    expect(CURRENT_CORE_WEB_VITALS).toEqual(["LCP", "INP", "CLS"]);
    expect(isCurrentCoreWebVital("INP")).toBe(true);
    expect(isCurrentCoreWebVital("LCP")).toBe(true);
    expect(isCurrentCoreWebVital("CLS")).toBe(true);
  });

  it("ensures FID is recognized as deprecated and not a current Core Web Vital", () => {
    expect(isCurrentCoreWebVital("FID")).toBe(false);
    expect(isDeprecatedWebVital("FID")).toBe(true);
  });

  it("ensures TTFB is recognized as diagnostic and not a current Core Web Vital", () => {
    expect(isCurrentCoreWebVital("TTFB")).toBe(false);
    expect(DIAGNOSTIC_WEB_VITALS).toContain("TTFB");
  });
});

