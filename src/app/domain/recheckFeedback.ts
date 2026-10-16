export type RecheckOutcome = "MATCHED" | "PRICE_CHANGED" | "UNAVAILABLE";
export type RecheckStatus = "USER_REPORTED";

export interface RecheckFeedbackRecord {
  id: string;
  opportunityId: string;
  route: string;
  observedPrice: number;
  reportedOutcome: RecheckOutcome;
  reportedPrice?: number | null;
  status: RecheckStatus; // Strictly USER_REPORTED per F30 acceptance criteria
  reportedAt: string;
  source: string;
  note?: string;
}

export function createRecheckFeedback(input: {
  opportunityId: string;
  route: string;
  observedPrice: number;
  reportedOutcome: RecheckOutcome;
  reportedPrice?: number | null;
  note?: string;
}): RecheckFeedbackRecord {
  return {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    opportunityId: input.opportunityId,
    route: input.route,
    observedPrice: input.observedPrice,
    reportedOutcome: input.reportedOutcome,
    reportedPrice: input.reportedPrice ?? null,
    status: "USER_REPORTED", // Invariant: Feedback remains USER_REPORTED until independently verified (F30)
    reportedAt: new Date().toISOString(),
    source: "deal_detail",
    note: input.note,
  };
}

const RECHECK_STORAGE_KEY = "farely.recheck_feedback_v1";

function getStorage(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return undefined;
}

export function getStoredRecheckFeedbacks(storage?: Storage): RecheckFeedbackRecord[] {
  const store = getStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(RECHECK_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecheckFeedback(record: RecheckFeedbackRecord, storage?: Storage): void {
  const store = getStorage(storage);
  if (!store) return;
  const list = getStoredRecheckFeedbacks(store);
  store.setItem(RECHECK_STORAGE_KEY, JSON.stringify([record, ...list]));
}

export function getFeedbackForOpportunity(opportunityId: string, storage?: Storage): RecheckFeedbackRecord | undefined {
  const list = getStoredRecheckFeedbacks(storage);
  return list.find((item) => item.opportunityId === opportunityId);
}
