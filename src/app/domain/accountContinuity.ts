/**
 * ANONYMOUS -> ACCOUNT CONTINUITY & IDENTITY ISOLATION (F44)
 * 
 * Satisfies:
 * - F44 (P2): Anonymous -> account continuity
 * 
 * INVARIANTS:
 * - "Explicit consent-based guest-to-account Saved/Watch transfer with identity isolation."
 * - "No silent cross-account merge."
 * - When a user logs out, their private local saved deals and watches are purged from the browser.
 * - Anonymous guest items require explicit consent before transferring to a newly signed-in account.
 * - Previous user A data can NEVER silently merge into user B under any circumstances.
 */

export const CONTINUITY_STORAGE_KEYS = {
  SAVED_OPPORTUNITIES: "farely.saved-opportunities",
  SAVED_SNAPSHOTS: "farely.saved-snapshots",
  LEGACY_BOOKMARKS: "flycheap.bookmarked-deals",
  LOCAL_WATCHES: "farely_local_watches_v1",
  SESSION_OWNER: "farely.session_owner_id",
  IS_GUEST_DATA: "farely.is_guest_created_data",
} as const;

export class CrossAccountContaminationError extends Error {
  priorOwner: string;
  attemptedOwner: string;

  constructor(priorOwner: string, attemptedOwner: string) {
    super(
      `F44 Invariant Violation: Detected data from prior user (${priorOwner}) attempting to merge into user (${attemptedOwner}). Cross-account data bleed is strictly prohibited.`
    );
    this.name = "CrossAccountContaminationError";
    this.priorOwner = priorOwner;
    this.attemptedOwner = attemptedOwner;
  }
}

export class SilentMergeProhibitedError extends Error {
  constructor() {
    super(
      "F44 Invariant Violation: Attempted silent merge of guest data into account without explicit user consent."
    );
    this.name = "SilentMergeProhibitedError";
  }
}

export interface GuestPendingData {
  hasGuestData: boolean;
  savedCount: number;
  watchCount: number;
  priorOwnerId?: string | null;
}

function getStore(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return undefined;
}

/**
 * Checks whether the current local storage has guest data created anonymously.
 */
export function inspectPendingGuestData(storage?: Storage): GuestPendingData {
  const store = getStore(storage);
  if (!store) {
    return { hasGuestData: false, savedCount: 0, watchCount: 0 };
  }

  let savedCount = 0;
  try {
    const rawSaved = store.getItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES) || "[]";
    const parsed = JSON.parse(rawSaved);
    if (Array.isArray(parsed)) savedCount = parsed.length;
  } catch {
    savedCount = 0;
  }

  let watchCount = 0;
  try {
    const rawWatches = store.getItem(CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES) || "[]";
    const parsed = JSON.parse(rawWatches);
    if (Array.isArray(parsed)) watchCount = parsed.length;
  } catch {
    watchCount = 0;
  }

  const isGuest = store.getItem(CONTINUITY_STORAGE_KEYS.IS_GUEST_DATA) === "true";
  const priorOwnerId = store.getItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER);

  return {
    hasGuestData: isGuest && (savedCount > 0 || watchCount > 0),
    savedCount,
    watchCount,
    priorOwnerId,
  };
}

/**
 * Marks that any current saved items or watches were created by an unauthenticated guest.
 */
export function markLocalDataAsGuest(storage?: Storage): void {
  const store = getStore(storage);
  if (!store) return;
  store.setItem(CONTINUITY_STORAGE_KEYS.IS_GUEST_DATA, "true");
  store.removeItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER);
}

/**
 * Purges all private user data on sign out to prevent cross-account leaks (F44).
 */
export function purgeLocalUserDataOnSignOut(storage?: Storage): void {
  const store = getStore(storage);
  if (!store) return;

  store.removeItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES);
  store.removeItem(CONTINUITY_STORAGE_KEYS.SAVED_SNAPSHOTS);
  store.removeItem(CONTINUITY_STORAGE_KEYS.LEGACY_BOOKMARKS);
  store.removeItem(CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES);
  store.removeItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER);
  store.removeItem(CONTINUITY_STORAGE_KEYS.IS_GUEST_DATA);
}

export type ContinuityResolution = "TRANSFERRED_WITH_CONSENT" | "DISCARDED_BY_USER" | "NOOP_NO_GUEST_DATA";

export interface ContinuityResult {
  resolution: ContinuityResolution;
  savedTransferred: number;
  watchesTransferred: number;
}

/**
 * Evaluates account continuity with explicit consent and strict identity isolation.
 */
export function resolveAccountContinuity(params: {
  currentUserId: string;
  explicitConsentGiven: boolean | null; // null = no decision made yet
  storage?: Storage;
}): ContinuityResult {
  const store = getStore(params.storage);
  if (!store) {
    return { resolution: "NOOP_NO_GUEST_DATA", savedTransferred: 0, watchesTransferred: 0 };
  }

  const pending = inspectPendingGuestData(store);

  // If there was a previous signed-in user and it differs from current, ensure no leak
  if (pending.priorOwnerId && pending.priorOwnerId !== params.currentUserId) {
    // Purge contaminated data immediately
    purgeLocalUserDataOnSignOut(store);
    throw new CrossAccountContaminationError(pending.priorOwnerId, params.currentUserId);
  }

  if (!pending.hasGuestData) {
    // Simply record current session owner
    store.setItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER, params.currentUserId);
    store.removeItem(CONTINUITY_STORAGE_KEYS.IS_GUEST_DATA);
    return { resolution: "NOOP_NO_GUEST_DATA", savedTransferred: 0, watchesTransferred: 0 };
  }

  // F44 Invariant: Explicit consent required; silent merge is forbidden
  if (params.explicitConsentGiven === null) {
    throw new SilentMergeProhibitedError();
  }

  if (params.explicitConsentGiven === true) {
    // User explicitly authorized migrating their guest discoveries into their account
    store.setItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER, params.currentUserId);
    store.removeItem(CONTINUITY_STORAGE_KEYS.IS_GUEST_DATA);
    return {
      resolution: "TRANSFERRED_WITH_CONSENT",
      savedTransferred: pending.savedCount,
      watchesTransferred: pending.watchCount,
    };
  } else {
    // User declined migration; discard guest items and keep account clean
    purgeLocalUserDataOnSignOut(store);
    store.setItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER, params.currentUserId);
    return {
      resolution: "DISCARDED_BY_USER",
      savedTransferred: 0,
      watchesTransferred: 0,
    };
  }
}
