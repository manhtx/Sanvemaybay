/**
 * Snapshot generation atomicity semantics.
 * Implements Section 29 requirements: generation_id, candidate validation,
 * transactional pointer switch, and reader isolation from partial writes.
 */

export interface SnapshotRecord {
  generation_id: string;
  dedupe_key: string;
  origin_code: string;
  destination_code: string;
  price: number;
}

export interface GenerationState {
  active_generation_id: string | null;
  records: SnapshotRecord[];
}

export class AtomicSnapshotStore {
  private activeGenerationId: string | null = null;
  private storage: SnapshotRecord[] = [];

  constructor(initialGenerationId?: string, initialRecords: SnapshotRecord[] = []) {
    if (initialGenerationId) {
      this.activeGenerationId = initialGenerationId;
      this.storage = [...initialRecords];
    }
  }

  getActiveGenerationId(): string | null {
    return this.activeGenerationId;
  }

  /**
   * Readers only read the active generation.
   * If no generation is designated, returns fallback or empty.
   */
  readActiveGeneration(): SnapshotRecord[] {
    if (!this.activeGenerationId) {
      return this.storage.filter((r) => !r.generation_id);
    }
    return this.storage.filter((r) => r.generation_id === this.activeGenerationId);
  }

  /**
   * Write candidate generation with validation before activation.
   * If writer throws midway, the active generation is untouched.
   */
  async publishGeneration(
    newGenerationId: string,
    buildRecords: () => Promise<SnapshotRecord[]>,
  ): Promise<{ success: boolean; activatedRecords: number }> {
    // 1. Build & write candidate records
    const candidateRecords = await buildRecords();

    // 2. Validate completeness before activation
    if (candidateRecords.length === 0) {
      throw new Error("Candidate generation validation failed: zero records");
    }

    // 3. Append candidate records to storage
    this.storage.push(...candidateRecords);

    // 4. Transactionally switch active pointer
    this.activeGenerationId = newGenerationId;

    // 5. Clean up old generations (keep only active)
    this.storage = this.storage.filter((r) => r.generation_id === this.activeGenerationId);

    return {
      success: true,
      activatedRecords: candidateRecords.length,
    };
  }
}
