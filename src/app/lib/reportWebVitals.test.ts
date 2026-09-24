import { describe, expect, it } from "vitest";
import { shouldSampleWebVitals } from "./reportWebVitals";

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
