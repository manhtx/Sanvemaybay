import { describe, expect, it } from "vitest";
import { appendLocalProductEvent, readLocalProductEvents, safeSerializeError, sanitizeProductEvent } from "./analytics";

function storage(): Storage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), clear: () => values.clear(), key: () => null, length: 0 };
}

describe("product analytics", () => {
  it("scrubs unknown metadata and bounds entity identifiers", () => {
    const event = sanitizeProductEvent({ eventType: "detail_view", entityId: "x".repeat(200), metadata: { route: "HAN-BKK", secret: "remove" } });
    expect(event.entityId).toHaveLength(120);
    expect(event.metadata).toEqual({ route: "HAN-BKK" });
  });

  it("stores a bounded local queue without blocking callers", async () => {
    const store = storage();
    for (let index = 0; index < 105; index += 1) appendLocalProductEvent({ eventType: "detail_view", entityId: String(index) }, store);
    expect(readLocalProductEvents(store)).toHaveLength(100);
    expect(readLocalProductEvents(store)[0].entityId).toBe("5");
  });

  it("safeSerializeError handles circular references without throwing", () => {
    const circularObj: any = { name: "test", details: { code: 400 } };
    circularObj.details.parent = circularObj;

    const serialized = safeSerializeError(circularObj);
    expect(serialized).toContain("\"name\":\"test\"");
    expect(serialized).toContain("\"parent\":\"[Circular]\"");
  });

  it("safeSerializeError caps depth and truncates oversized strings", () => {
    const deepObj = {
      level1: {
        level2: {
          level3: {
            level4: {
              data: "deep value",
            },
          },
        },
      },
      longText: "A".repeat(1500),
    };

    const serialized = safeSerializeError(deepObj, 3);
    const parsed = JSON.parse(serialized);

    expect(parsed.level1.level2.level3).toBe("[MaxDepthExceeded]");
    expect(parsed.longText).toContain("...[TRUNCATED]");
    expect(parsed.longText.length).toBeLessThan(1100);
  });
});
