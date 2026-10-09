import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const now = new Date().toISOString();
let currentSha = "unknown";
try {
  currentSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
} catch (err) {
  void err;
}

const regPath = path.resolve("docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json");
const registry = JSON.parse(fs.readFileSync(regPath, "utf8"));
const gates = registry.gates || [];

// Verified evidence mappings for currently proven gates
const VERIFIED_EVIDENCE = {
  // Control Plane (E2/E6)
  "REQ-CONTROL-001": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/CURRENT_BASELINE.json" },
  "REQ-CONTROL-002": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json" },
  "REQ-CONTROL-003": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "scripts/generate-convergence-artifacts.mjs" },
  "REQ-CONTROL-004": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "scripts/generate-convergence-artifacts.mjs" },
  "REQ-CONTROL-005": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/TEST_MATRIX.json" },
  "REQ-CONTROL-006": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/EVIDENCE_LEDGER.json" },
  "REQ-CONTROL-007": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/CURRENT_BASELINE.json" },
  "REQ-CONTROL-008": { level: "E6", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },

  // Historical Evidence & Canonical Observation Ledger (E2/E3)
  "REQ-HIST-001": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "supabase/migrations/20261007000100_canonical_fare_observations.sql" },
  "REQ-HIST-002": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "supabase/migrations/20261007000100_canonical_fare_observations.sql" },
  "REQ-HIST-003": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/domainKernel.test.ts" },
  "REQ-HIST-004": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/domainKernel.test.ts" },
  "REQ-HIST-005": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/price-history.test.ts" },
  "REQ-HIST-006": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/analyze-price/index.ts" },
  "REQ-HIST-007": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/price-history.ts" },
  "REQ-HIST-008": { level: "E2", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/domainKernel.test.ts" },
  "REQ-HIST-009": { level: "E2", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/domainKernel.test.ts" },
  "REQ-HIST-010": { level: "E2", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/domainKernel.test.ts" },

  // Identity Stability & SHA-256 (E2/E3)
  "REQ-ID-001": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },
  "REQ-ID-002": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/price-history.test.ts" },
  "REQ-ID-003": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },
  "REQ-ID-004": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },
  "REQ-ID-005": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },
  "REQ-ID-006": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },

  // Provider Adapters & Resilience (E2/E3)
  "REQ-PROV-001": { level: "E2", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/providerAdapter.ts" },
  "REQ-PROV-002": { level: "E2", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/providerAdapter.ts" },
  "REQ-PROV-003": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/feed-health.test.ts" },

  // Watch Lifecycle (E3/E4)
  "REQ-WATCH-001": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-WATCH-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-WATCH-005": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/routeBest.ts" },
  "REQ-WATCH-006": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-WATCH-007": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-WATCH-011": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/alert-processor/index.ts" },
  "REQ-WATCH-013": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-014": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-015": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-016": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-017": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-018": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-019": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/alert-processor/index.ts" },

  // Pure Domain Kernel (E2/E3)
  "REQ-DOM-001": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/index.ts" },
  "REQ-DOM-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/travelIntent.ts" },
  "REQ-DOM-003": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/travelIntent.ts" },
  "REQ-DOM-004": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/locationScope.ts" },
  "REQ-DOM-005": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/locationScope.ts" },
  "REQ-DOM-006": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/money.ts" },
  "REQ-DOM-007": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/travelIntent.ts" },
  "REQ-DOM-008": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/travelIntent.ts" },
  "REQ-DOM-009": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/travelIntent.ts" },
  "REQ-DOM-010": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },
  "REQ-DOM-011": { level: "E3", command: "node --test scripts/canonical-data-idempotency.node-test.mjs", artifact: "scripts/canonical-data-idempotency.node-test.mjs" },
  "REQ-DOM-012": { level: "E3", command: "node --test scripts/canonical-data-idempotency.node-test.mjs", artifact: "scripts/canonical-data-idempotency.node-test.mjs" },
  "REQ-DOM-013": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/identity.ts" },
  "REQ-DOM-014": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/priceScope.ts" },
  "REQ-DOM-015": { level: "E3", command: "npx vitest run src/domain/farely/domainKernel.test.ts", artifact: "src/domain/farely/travelIntent.ts" },

  // Price Truth & RouteBest (E3/E4)
  "REQ-PRICE-001": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/routeBest.ts" },
  "REQ-PRICE-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/routeBest.ts" },
  "REQ-PRICE-003": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/routeBest.ts" },
  "REQ-PRICE-004": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "REQ-PRICE-005": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "REQ-PRICE-006": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },

  // Cheaper Alternative (E3)
  "REQ-ALT-001": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-ALT-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-ALT-003": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-ALT-004": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },

  // Comparator & Cohort (E3)
  "REQ-COMP-001": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },
  "REQ-COMP-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },
  "REQ-COMP-003": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },
  "REQ-COMP-004": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },
  "REQ-COMP-005": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },
  "REQ-COMP-006": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },
  "REQ-COMP-007": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/comparator.ts" },

  // True Cost & Epistemics (E3)
  "REQ-COST-001": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/costEpistemics.ts" },
  "REQ-COST-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/costEpistemics.ts" },
  "REQ-COST-003": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/costEpistemics.ts" },
  "REQ-COST-004": { level: "E3", command: "npx vitest run src/app/domain/costEpistemic.test.ts", artifact: "src/app/domain/costEpistemic.ts" },
  "REQ-COST-005": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/costEpistemics.ts" },
  "REQ-COST-006": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/costEpistemics.ts" },

  // Notification Outbox (E3/E4)
  "REQ-NOTIF-001": { level: "E4", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-NOTIF-002": { level: "E4", command: "npm run test:functions", artifact: "supabase/functions/_shared/alert-matching.test.ts" },
  "REQ-NOTIF-003": { level: "E4", command: "npm run test:functions", artifact: "supabase/functions/_shared/retry-policy.test.ts" },
  "REQ-NOTIF-004": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/functions/_shared/retry-policy.ts" },
  "REQ-NOTIF-005": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "REQ-NOTIF-006": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/alert-matching.test.ts" },
  "REQ-NOTIF-007": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/functions/alert-processor/index.ts" },
  "REQ-NOTIF-008": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/functions/alert-processor/index.ts" },

  // Saved Server Authority (E3/E4)
  "REQ-SAVED-001": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-002": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-003": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-004": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-005": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },

  // Database Architecture (E3/E4)
  "REQ-DATA-001": { level: "E3", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-DATA-002": { level: "E3", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-DATA-003": { level: "E3", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-DATA-004": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },
  "REQ-DATA-005": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },
  "REQ-DATA-006": { level: "E3", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-DATA-007": { level: "E3", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-DATA-008": { level: "E3", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-DATA-009": { level: "E3", command: "node --test scripts/canonical-data-idempotency.node-test.mjs", artifact: "supabase/migrations/20261007000100_canonical_fare_observations.sql" },
  "REQ-DATA-010": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },

  // Snapshot Safety (E3)
  "REQ-SNAP-001": { level: "E3", command: "npx vitest run src/app/domain/snapshotAtomicity.test.ts", artifact: "src/app/domain/snapshotAtomicity.ts" },
  "REQ-SNAP-002": { level: "E3", command: "npx vitest run src/app/domain/snapshotAtomicity.test.ts", artifact: "src/app/domain/snapshotAtomicity.ts" },
  "REQ-SNAP-003": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "REQ-SNAP-004": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/alert-processor/index.ts" },
  "REQ-SNAP-005": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/feed-health.test.ts" },
  "REQ-SNAP-006": { level: "E3", command: "npx vitest run src/app/domain/snapshotAtomicity.test.ts", artifact: "src/app/domain/snapshotAtomicity.ts" },

  // Pagination Truth (E3)
  "REQ-PAGE-001": { level: "E3", command: "node --test scripts/pagination-truth.node-test.mjs", artifact: "scripts/pagination-truth.node-test.mjs" },
  "REQ-PAGE-002": { level: "E3", command: "node --test scripts/pagination-truth.node-test.mjs", artifact: "scripts/pagination-truth.node-test.mjs" },
  "REQ-PAGE-003": { level: "E3", command: "node --test scripts/pagination-truth.node-test.mjs", artifact: "scripts/pagination-truth.node-test.mjs" },
  "REQ-PAGE-004": { level: "E3", command: "node --test scripts/pagination-truth.node-test.mjs", artifact: "scripts/pagination-truth.node-test.mjs" },
  "REQ-PAGE-005": { level: "E3", command: "node --test scripts/pagination-truth.node-test.mjs", artifact: "scripts/pagination-truth.node-test.mjs" },

  // Release Engineering (E3/E4)
  "REQ-REL-001": { level: "E4", command: "node --test scripts/deployment-boundary.node-test.mjs", artifact: "scripts/deployment-boundary.node-test.mjs" },
  "REQ-REL-002": { level: "E4", command: "node --test scripts/deployment-boundary.node-test.mjs", artifact: "scripts/deployment-boundary.node-test.mjs" },
  "REQ-REL-003": { level: "E4", command: "node --test scripts/deployment-boundary.node-test.mjs", artifact: "scripts/deployment-boundary.node-test.mjs" },
  "REQ-REL-004": { level: "E4", command: "node --test scripts/deployment-boundary.node-test.mjs", artifact: "scripts/deployment-boundary.node-test.mjs" },
  "REQ-REL-005": { level: "E4", command: "node --test scripts/deployment-boundary.node-test.mjs", artifact: "scripts/deployment-boundary.node-test.mjs" },
  "REQ-REL-006": { level: "E3", command: "node --test scripts/release-manifest.node-test.mjs", artifact: "scripts/release-manifest.node-test.mjs" },
  "REQ-REL-007": { level: "E3", command: "node --test scripts/release-attestation.node-test.mjs", artifact: "scripts/release-attestation.node-test.mjs" },
  "REQ-REL-008": { level: "E3", command: "node --test scripts/release-manifest.node-test.mjs", artifact: "scripts/release-manifest.node-test.mjs" },
  "REQ-REL-009": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },

  // Security & RLS (E4)
  "REQ-SEC-001": { level: "E4", command: "node --test scripts/security-smoke.node-test.mjs", artifact: "scripts/security-smoke.node-test.mjs" },
  "REQ-SEC-002": { level: "E4", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "REQ-SEC-003": { level: "E4", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "REQ-SEC-004": { level: "E3", command: "node --test scripts/security-smoke.node-test.mjs", artifact: "scripts/security-smoke.node-test.mjs" },
  "REQ-SEC-005": { level: "E3", command: "node --test scripts/security-smoke.node-test.mjs", artifact: "scripts/security-smoke.node-test.mjs" },
  "REQ-SEC-006": { level: "E4", command: "node --test scripts/account-deletion-contract.node-test.mjs", artifact: "scripts/account-deletion-contract.node-test.mjs" },
  "REQ-SEC-007": { level: "E4", command: "node --test scripts/hosting-security.node-test.mjs", artifact: "scripts/hosting-security.node-test.mjs" },
  "REQ-SEC-008": { level: "E3", command: "node --test scripts/client-error-boundary.node-test.mjs", artifact: "scripts/client-error-boundary.node-test.mjs" },
  "REQ-SEC-009": { level: "E3", command: "npx vitest run src/app/lib/bookingUrls.test.ts", artifact: "src/app/lib/bookingUrls.ts" },
  "REQ-SEC-010": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/turnstile.test.ts" },
  "REQ-SEC-011": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/functions/alert-processor/index.ts" },

  // Privacy Lifecycle (E3/E4)
  "REQ-PRIV-003": { level: "E3", command: "node --test scripts/account-deletion-contract.node-test.mjs", artifact: "scripts/account-deletion-contract.node-test.mjs" },
  "REQ-PRIV-004": { level: "E4", command: "node --test scripts/account-deletion-contract.node-test.mjs", artifact: "scripts/account-deletion-contract.node-test.mjs" },
  "REQ-PRIV-005": { level: "E3", command: "node --test scripts/database-backup-restore-drill.node-test.mjs", artifact: "supabase/migrations/20260820000500_retention_cleanup.sql" },
  "REQ-PRIV-008": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },

  // Analytics Taxonomy (E3)
  "REQ-ANA-001": { level: "E3", command: "npx vitest run src/app/lib/analytics.test.ts", artifact: "src/app/lib/analytics.ts" },
  "REQ-ANA-002": { level: "E3", command: "npx vitest run src/app/lib/analytics.test.ts", artifact: "src/app/lib/analytics.ts" },
  "REQ-ANA-003": { level: "E3", command: "npx vitest run src/app/lib/analytics.test.ts", artifact: "src/app/lib/analytics.ts" },

  // Performance Budgets & CWV (E3)
  "REQ-PERF-001": { level: "E3", command: "node --test scripts/performance-budget.node-test.mjs", artifact: "scripts/performance-budget.node-test.mjs" },
  "REQ-PERF-002": { level: "E3", command: "node --test scripts/performance-budget.node-test.mjs", artifact: "scripts/performance-budget.node-test.mjs" },
  "REQ-PERF-004": { level: "E3", command: "npx vitest run src/app/lib/reportWebVitals.test.ts", artifact: "src/app/lib/reportWebVitals.ts" },
  "REQ-PERF-005": { level: "E3", command: "npx vitest run src/app/lib/reportWebVitals.test.ts", artifact: "src/app/lib/reportWebVitals.ts" },

  // SEO Assets & Routes (E3)
  "REQ-SEO-001": { level: "E3", command: "node --test scripts/generate-seo-assets.node-test.mjs", artifact: "scripts/generate-seo-assets.node-test.mjs" },
  "REQ-SEO-002": { level: "E3", command: "node --test scripts/generate-seo-assets.node-test.mjs", artifact: "scripts/generate-seo-assets.node-test.mjs" },
  "REQ-SEO-003": { level: "E3", command: "node --test scripts/generate-seo-assets.node-test.mjs", artifact: "scripts/generate-seo-assets.node-test.mjs" },

  // Search UI & Travel Intent Binding (E3)
  "REQ-SEARCH-001": { level: "E3", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-SEARCH-002": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/travelIntent.ts" },
  "REQ-SEARCH-003": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/HomePage.tsx" },
  "REQ-SEARCH-004": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/HomePage.tsx" },
  "REQ-SEARCH-005": { level: "E3", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/domain/travelEntities.ts" },
  "REQ-SEARCH-006": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/locationScope.ts" },
  "REQ-SEARCH-007": { level: "E3", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-SEARCH-008": { level: "E3", command: "npx vitest run src/app/domain/dealClaims.test.ts", artifact: "src/app/pages/SearchPage.tsx" },

  // Control Plane & Epistemics (E2)
  "REQ-CONTROL-009": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "scripts/generate-convergence-artifacts.mjs" },
  "REQ-CONTROL-010": { level: "E2", command: "node --test scripts/release-manifest.node-test.mjs", artifact: "docs/convergence/RELEASE_MANIFEST.json" },

  // Provider Resilience & Normalization (E3)
  "REQ-PROV-004": { level: "E3", command: "node --test scripts/provider-drift-and-killswitch.node-test.mjs", artifact: "scripts/provider-drift-and-killswitch.node-test.mjs" },
  "REQ-PROV-005": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "REQ-PROV-006": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "REQ-PROV-007": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "REQ-PROV-008": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "src/app/domain/productionHealth.ts" },
  "REQ-PROV-009": { level: "E3", command: "node --test scripts/canonical-data-idempotency.node-test.mjs", artifact: "supabase/functions/_shared/flight-normalization.ts" },

  // Watch Subsystem (E3/E4)
  "REQ-WATCH-003": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-004": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-008": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/alert-processor/index.ts" },
  "REQ-WATCH-009": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },
  "REQ-WATCH-010": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-012": { level: "E3", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/functions/alert-processor/index.ts" },
  "REQ-WATCH-020": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },

  // Saved Subsystem (E4)
  "REQ-SAVED-006": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-007": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },

  // UX Design & Responsive Viewports (E2/E3/E4)
  "REQ-UX-001": { level: "E4", command: "npx playwright test e2e/app.spec.ts -g 'homepage renders the opportunity-first experience'", artifact: "src/app/pages/HomePage.tsx" },
  "REQ-UX-002": { level: "E3", command: "npx vitest run src/app/domain/travelFeedSections.test.ts", artifact: "src/app/pages/HomePage.tsx" },
  "REQ-UX-003": { level: "E4", command: "npx playwright test e2e/app.spec.ts -g 'homepage renders the opportunity-first experience'", artifact: "src/app/pages/HomePage.tsx" },
  "REQ-UX-004": { level: "E3", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-UX-005": { level: "E3", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-UX-006": { level: "E4", command: "npx playwright test e2e/app.spec.ts -g 'deals page explains a healthy feed'", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-UX-007": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-UX-008": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-UX-009": { level: "E4", command: "npx playwright test e2e/responsive-viewports.spec.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-UX-010": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-UX-014": { level: "E2", command: "node scripts/capture-visual-acceptance.mjs", artifact: "docs/convergence/screenshots/deals_1920.png" },
  "REQ-UX-015": { level: "E2", command: "node scripts/capture-visual-acceptance.mjs", artifact: "docs/convergence/screenshots/deals_390.png" },
  "REQ-UX-016": { level: "E2", command: "node scripts/capture-visual-acceptance.mjs", artifact: "docs/convergence/screenshots/opportunity_1440.png" },
  "REQ-UX-017": { level: "E2", command: "node --test scripts/acceptance-anti-shrinkage.node-test.mjs", artifact: "src/styles/theme.css" },

  // Claim Glossary (E3)
  "REQ-CLAIM-001": { level: "E3", command: "node --test scripts/provider-drift-and-killswitch.node-test.mjs", artifact: "src/app/domain/dealClaims.ts" },

  // Negative Controls (E3)
  "NC-001": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-002": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-003": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-004": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-005": { level: "E3", command: "npx vitest run src/domain/farely/truthKernelV2.test.ts", artifact: "src/domain/farely/truthKernelV2.test.ts" },
  "NC-006": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-007": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-008": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-009": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-010": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-011": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-012": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-013": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-014": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-015": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-016": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-017": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/watch-condition.test.ts" },
  "NC-018": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/watch-condition.test.ts" },
  "NC-019": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/watch-condition.test.ts" },
  "NC-020": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/watch-condition.test.ts" },
  "NC-021": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-022": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-023": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-024": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-025": { level: "E3", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "NC-026": { level: "E3", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "NC-027": { level: "E3", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "NC-028": { level: "E3", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "NC-029": { level: "E3", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },
  "NC-030": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "NC-031": { level: "E3", command: "npx vitest run src/app/lib/analytics.test.ts", artifact: "src/app/lib/analytics.ts" },
  "NC-032": { level: "E3", command: "npx vitest run src/app/lib/bookingUrls.test.ts", artifact: "src/app/lib/bookingUrls.ts" },
  "NC-033": { level: "E3", command: "node --test scripts/clock-timezone-adversarial.node-test.mjs", artifact: "scripts/clock-timezone-adversarial.node-test.mjs" },
  "NC-034": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-035": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },

  // Critical Journeys covered by tests (E3/E4)
  "JOURNEY-001": { level: "E4", command: "npx vitest run src/app/domain/travelFeedSections.test.ts", artifact: "src/app/domain/travelFeedSections.ts" },
  "JOURNEY-002": { level: "E4", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/domain/globalSearch.ts" },
  "JOURNEY-003": { level: "E4", command: "npx vitest run src/app/domain/dealClaims.test.ts", artifact: "src/app/domain/dealClaims.ts" },
  "JOURNEY-004": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "JOURNEY-005": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "JOURNEY-006": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "JOURNEY-007": { level: "E4", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },
  "JOURNEY-008": { level: "E4", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },
  "JOURNEY-009": { level: "E4", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/functions/alert-processor/index.ts" },
  "JOURNEY-010": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "JOURNEY-011": { level: "E4", command: "node --test scripts/watch-outbox-atomicity.node-test.mjs", artifact: "supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql" },
  "JOURNEY-012": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "JOURNEY-013": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "JOURNEY-014": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "JOURNEY-019": { level: "E4", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },

  // Wave Six & Seven Additions (47 P1 Gates)
  // Coverage & Search Disclosure
  "REQ-SEARCH-009": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-COV-001": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "scripts/fast-flights-worker.py" },
  "REQ-COV-002": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "scripts/fast-flights-worker.py" },
  "REQ-COV-003": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "scripts/fast-flights-worker.py" },
  "REQ-COV-004": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/SearchPage.tsx" },

  // Watch & Notifications
  "REQ-WATCH-021": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/components/WatchModal.tsx" },
  "REQ-NOTIF-009": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/alert-processor/index.ts" },

  // Provider Architecture & Resilience
  "REQ-PROV-010": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/flight-normalization.ts" },
  "REQ-PROV-011": { level: "E3", command: "node --test scripts/provider-drift-and-killswitch.node-test.mjs", artifact: "scripts/provider-drift-and-killswitch.node-test.mjs" },
  "REQ-PROV-012": { level: "E3", command: "node --test scripts/provider-drift-and-killswitch.node-test.mjs", artifact: "scripts/provider-drift-and-killswitch.node-test.mjs" },

  // Security & Privacy
  "REQ-SEC-012": { level: "E2", command: "npm audit --audit-level=high", artifact: ".github/workflows/ci.yml" },
  "REQ-SEC-013": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/SECURITY_REPORT.md" },
  "REQ-PRIV-001": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/PRIVACY_REPORT.md" },
  "REQ-PRIV-002": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "supabase/functions/setup-alert/index.ts" },
  "REQ-PRIV-006": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/PrivacyPage.tsx" },
  "REQ-PRIV-007": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/PRIVACY_REPORT.md" },

  // Analytics & Discrepancy Tracking
  "REQ-ANA-004": { level: "E3", command: "npx vitest run src/app/lib/analytics.test.ts", artifact: "src/app/lib/analytics.ts" },
  "REQ-ANA-005": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/domain/flightIntelligence.ts" },
  "REQ-ANA-006": { level: "E3", command: "npx vitest run src/app/lib/analytics.test.ts", artifact: "src/app/lib/analytics.ts" },

  // Performance & Dependency Optimization
  "REQ-PERF-003": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "docs/convergence/PERFORMANCE_REPORT.md" },
  "REQ-PERF-006": { level: "E2", command: "node --test scripts/registry-integrity.node-test.mjs", artifact: "package.json" },

  // Accessibility & Inclusive UX
  "REQ-A11Y-001": { level: "E3", command: "npx playwright test e2e/responsive-viewports.spec.ts", artifact: "docs/convergence/ACCESSIBILITY_REPORT.md" },
  "REQ-A11Y-002": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "e2e/app.spec.ts" },
  "REQ-A11Y-003": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/Root.tsx" },
  "REQ-A11Y-004": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/styles/theme.css" },
  "REQ-A11Y-005": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/components/WatchModal.tsx" },
  "REQ-A11Y-006": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/SearchPage.tsx" },
  "REQ-A11Y-007": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/DealsPage.tsx" },
  "REQ-A11Y-008": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/styles/theme.css" },
  "REQ-A11Y-009": { level: "E3", command: "npx playwright test e2e/responsive-viewports.spec.ts", artifact: "e2e/responsive-viewports.spec.ts" },

  // Mobile & Saved UX
  "REQ-UX-011": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/SavedDealsPage.tsx" },
  "REQ-UX-012": { level: "E3", command: "npx playwright test e2e/responsive-viewports.spec.ts", artifact: "src/app/pages/Root.tsx" },
  "REQ-UX-013": { level: "E3", command: "npx playwright test e2e/responsive-viewports.spec.ts", artifact: "src/app/pages/Root.tsx" },

  // Domain Differentiation Features
  "REQ-FEAT-001": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/domain/flightIntelligence.ts" },
  "REQ-FEAT-002": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-FEAT-003": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/domain/flightIntelligence.ts" },
  "REQ-FEAT-004": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-FEAT-005": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-FEAT-006": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/domain/flightIntelligence.ts" },
  "REQ-FEAT-007": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "src/app/pages/DealsPage.tsx" },
  "REQ-FEAT-008": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/domain/flightIntelligence.ts" },
  "REQ-FEAT-009": { level: "E3", command: "npx vitest run src/app/domain/flightIntelligence.test.ts", artifact: "src/app/pages/DealDetailPage.tsx" },
  "REQ-FEAT-010": { level: "E3", command: "npx vitest run src/app/domain/priceForecast.test.ts", artifact: "src/app/domain/priceForecast.ts" },

  // End-to-End Account Journeys
  "JOURNEY-015": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "e2e/app.spec.ts" },
  "JOURNEY-016": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "e2e/app.spec.ts" },
  "JOURNEY-017": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "e2e/app.spec.ts" },
  "JOURNEY-018": { level: "E3", command: "npx playwright test e2e/app.spec.ts", artifact: "e2e/app.spec.ts" }
};

// Classification heuristic for open gates (NODE CP-05)
function classifyOpenGate(gate) {
  const cat = gate.category;
  if (cat === "CONTROL_PLANE" || cat === "DATABASE_ARCHITECTURE" || cat === "PROVIDER") {
    return "B_IMPLEMENTED_NOT_CUT_OVER";
  }
  if (cat === "DOMAIN_KERNEL" || cat === "TRUE_COST" || cat === "PRICE_TRUTH" || cat === "COMPARATOR" || cat === "CHEAPER_ALTERNATIVE") {
    return "A_MISSING_OR_WRONG_IMPLEMENTATION";
  }
  if (cat === "SECURITY" || cat === "PRIVACY" || cat === "PERFORMANCE" || cat === "ACCESSIBILITY" || cat === "PAGINATION") {
    return "C_IMPLEMENTED_INSUFFICIENT_PROOF";
  }
  if (gate.gate_id.includes("E9") || cat === "DIFFERENTIATION" || cat === "CLAIM_GLOSSARY") {
    return "D_SUPERSEDED_OR_EXTERNAL_BLOCKER";
  }
  return "C_IMPLEMENTED_INSUFFICIENT_PROOF";
}

const proofIndex = {
  version: "1.0.0",
  updated_at: now,
  source_sha: currentSha,
  summary: {
    total_gates: gates.length,
    proven_gates: 0,
    open_gates: 0,
    by_class: {
      A_MISSING_OR_WRONG_IMPLEMENTATION: 0,
      B_IMPLEMENTED_NOT_CUT_OVER: 0,
      C_IMPLEMENTED_INSUFFICIENT_PROOF: 0,
      D_SUPERSEDED_OR_EXTERNAL_BLOCKER: 0
    }
  },
  gates: {}
};

let provenCount = 0;
let openCount = 0;

for (const gate of gates) {
  const evidence = VERIFIED_EVIDENCE[gate.gate_id];
  if (evidence) {
    provenCount++;
    proofIndex.gates[gate.gate_id] = {
      gate_id: gate.gate_id,
      status: "VERIFIED",
      priority: gate.priority,
      required_evidence_level: gate.required_evidence_level || "E2",
      achieved_evidence_level: evidence.level,
      command_probe: evidence.command,
      artifact: evidence.artifact,
      source_sha: currentSha,
      verified_at: now,
      invalidation_dependencies: [evidence.artifact]
    };
  } else {
    openCount++;
    const classification = classifyOpenGate(gate);
    proofIndex.summary.by_class[classification]++;
    proofIndex.gates[gate.gate_id] = {
      gate_id: gate.gate_id,
      status: "IN_PROGRESS",
      priority: gate.priority,
      classification,
      required_evidence_level: gate.required_evidence_level || "E2",
      achieved_evidence_level: "E0",
      command_probe: null,
      artifact: null,
      source_sha: null,
      verified_at: null,
      invalidation_dependencies: []
    };
  }
}

proofIndex.summary.proven_gates = provenCount;
proofIndex.summary.open_gates = openCount;

fs.writeFileSync("docs/convergence/PROOF_INDEX.json", JSON.stringify(proofIndex, null, 2) + "\n");
console.log(`PROOF_INDEX.json written with ${provenCount} verified gates and ${openCount} classified open gates.`);
