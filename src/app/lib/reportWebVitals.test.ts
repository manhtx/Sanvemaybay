import { describe, expect, it } from "vitest";
import {
  CURRENT_CORE_WEB_VITALS,
  DEPRECATED_WEB_VITALS,
  DIAGNOSTIC_WEB_VITALS,
  isCurrentCoreWebVital,
  isDeprecatedWebVital,
  shouldSampleWebVitals,
} from "./reportWebVitals";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  };
}

describe("shouldSampleWebVitals", () => {
  it("uses one stable privacy-preserving decision per session when sampled", () => {
    const store = createStorage();
    // First decision: random returns 0.1 < 0.25 -> sampled ("yes")
    expect(shouldSampleWebVitals(0.25, store, () => 0.1)).toBe(true);
    // Subsequent calls respect cached "yes" even if random would have yielded 0.9
    expect(shouldSampleWebVitals(0.25, store, () => 0.9)).toBe(true);
    expect(store.getItem("flycheap.rum-sampled")).toBe("yes");
  });

  it("uses one stable privacy-preserving decision per session when not sampled", () => {
    const store = createStorage();
    // First decision: random returns 0.8 >= 0.25 -> not sampled ("no")
    expect(shouldSampleWebVitals(0.25, store, () => 0.8)).toBe(false);
    // Subsequent calls respect cached "no" even if random would have yielded 0.01
    expect(shouldSampleWebVitals(0.25, store, () => 0.01)).toBe(false);
    expect(store.getItem("flycheap.rum-sampled")).toBe("no");
  });

  it("bounds negative and zero sampling configuration", () => {
    expect(shouldSampleWebVitals(-1, createStorage(), () => 0)).toBe(false);
    expect(shouldSampleWebVitals(-0.01, createStorage(), () => 0)).toBe(false);
    expect(shouldSampleWebVitals(0, createStorage(), () => 0)).toBe(false);
  });

  it("bounds sampling configuration greater than or equal to 1", () => {
    expect(shouldSampleWebVitals(1, createStorage(), () => 0.999)).toBe(true);
    expect(shouldSampleWebVitals(2, createStorage(), () => 0.999)).toBe(true);
    expect(shouldSampleWebVitals(100, createStorage(), () => 0.999)).toBe(true);
  });

  it("safely coerces non-finite sampling rates to zero", () => {
    expect(shouldSampleWebVitals(NaN, createStorage(), () => 0)).toBe(false);
    expect(shouldSampleWebVitals(Infinity, createStorage(), () => 0)).toBe(false);
    expect(shouldSampleWebVitals(-Infinity, createStorage(), () => 0)).toBe(false);
  });

  it("operates safely when storage is undefined (SSR / non-browser environment)", () => {
    expect(shouldSampleWebVitals(0.5, undefined, () => 0.2)).toBe(true);
    expect(shouldSampleWebVitals(0.5, undefined, () => 0.7)).toBe(false);
  });

  it("prioritizes existing session storage state over random provider", () => {
    const store = createStorage();
    store.setItem("flycheap.rum-sampled", "yes");
    let randomCalled = false;
    const randomSpy = () => {
      randomCalled = true;
      return 0.99;
    };
    expect(shouldSampleWebVitals(0.001, store, randomSpy)).toBe(true);
    expect(randomCalled).toBe(false);

    store.setItem("flycheap.rum-sampled", "no");
    expect(shouldSampleWebVitals(0.999, store, randomSpy)).toBe(false);
    expect(randomCalled).toBe(false);
  });

  it("overwrites unrecognized storage values with a fresh decision", () => {
    const store = createStorage();
    store.setItem("flycheap.rum-sampled", "corrupted");
    expect(shouldSampleWebVitals(0.5, store, () => 0.1)).toBe(true);
    expect(store.getItem("flycheap.rum-sampled")).toBe("yes");
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
    expect(DEPRECATED_WEB_VITALS).toEqual(["FID"]);
    expect(isCurrentCoreWebVital("FID")).toBe(false);
    expect(isDeprecatedWebVital("FID")).toBe(true);
  });

  it("ensures TTFB is recognized as diagnostic and not a current Core Web Vital", () => {
    expect(DIAGNOSTIC_WEB_VITALS).toEqual(["TTFB"]);
    expect(isCurrentCoreWebVital("TTFB")).toBe(false);
    expect(isDeprecatedWebVital("TTFB")).toBe(false);
  });

  it("rejects unknown or arbitrary metric tokens", () => {
    expect(isCurrentCoreWebVital("FCP")).toBe(false);
    expect(isCurrentCoreWebVital("")).toBe(false);
    expect(isCurrentCoreWebVital("lcp")).toBe(false);
    expect(isCurrentCoreWebVital("unknown_metric")).toBe(false);
    expect(isDeprecatedWebVital("FCP")).toBe(false);
    expect(isDeprecatedWebVital("inp")).toBe(false);
  });
});
