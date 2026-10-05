import { describe, expect, it } from "vitest";
import { AtomicSnapshotStore, SnapshotRecord } from "./snapshotAtomicity";

describe("Atomic Snapshot Publication & Reader Isolation (Section 29)", () => {
  it("Negative Control: Failure halfway through candidate generation leaves active generation 100% intact with zero partial state visible to readers", async () => {
    const genA = "gen-11111111-1111-1111-1111-111111111111";
    const initialRecords: SnapshotRecord[] = [
      { generation_id: genA, dedupe_key: "SGN:HAN:2026-10-10", origin_code: "SGN", destination_code: "HAN", price: 1200000 },
      { generation_id: genA, dedupe_key: "HAN:BKK:2026-10-12", origin_code: "HAN", destination_code: "BKK", price: 2400000 },
      { generation_id: genA, dedupe_key: "DAD:ICN:2026-10-15", origin_code: "DAD", destination_code: "ICN", price: 4100000 },
    ];

    const store = new AtomicSnapshotStore(genA, initialRecords);

    // Verify initial active generation
    const initialRead = store.readActiveGeneration();
    expect(initialRead.length).toBe(3);
    expect(initialRead.every((r) => r.generation_id === genA)).toBe(true);

    // Now attempt to publish Generation B, but inject a failure halfway through
    const genB = "gen-22222222-2222-2222-2222-222222222222";
    let failureTriggered = false;

    try {
      await store.publishGeneration(genB, async () => {
        // Inject failure during generation build
        throw new Error("Provider stream aborted unexpectedly halfway through snapshot construction");
      });
    } catch {
      failureTriggered = true;
    }

    expect(failureTriggered).toBe(true);

    // Reader MUST see complete previous generation A, NEVER partial generation B or a mixed state
    const afterFailureRead = store.readActiveGeneration();
    expect(afterFailureRead.length).toBe(3);
    expect(afterFailureRead.every((r) => r.generation_id === genA)).toBe(true);
    expect(store.getActiveGenerationId()).toBe(genA);

    // Negative control verification: no records from genB are ever visible to readers
    const hasGenB = afterFailureRead.some((r) => r.generation_id === genB);
    expect(hasGenB).toBe(false);

    // Now successfully publish Generation C
    const genC = "gen-33333333-3333-3333-3333-333333333333";
    const genCRecords: SnapshotRecord[] = [
      { generation_id: genC, dedupe_key: "SGN:HAN:2026-10-10", origin_code: "SGN", destination_code: "HAN", price: 1100000 },
      { generation_id: genC, dedupe_key: "HAN:BKK:2026-10-12", origin_code: "HAN", destination_code: "BKK", price: 2300000 },
      { generation_id: genC, dedupe_key: "DAD:ICN:2026-10-15", origin_code: "DAD", destination_code: "ICN", price: 3950000 },
      { generation_id: genC, dedupe_key: "SGN:SIN:2026-10-20", origin_code: "SGN", destination_code: "SIN", price: 1850000 },
    ];

    const result = await store.publishGeneration(genC, async () => genCRecords);
    expect(result.success).toBe(true);
    expect(result.activatedRecords).toBe(4);

    // Readers immediately see 100% of Generation C
    const afterSuccessRead = store.readActiveGeneration();
    expect(afterSuccessRead.length).toBe(4);
    expect(afterSuccessRead.every((r) => r.generation_id === genC)).toBe(true);
    expect(store.getActiveGenerationId()).toBe(genC);
  });
});
