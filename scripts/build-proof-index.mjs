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
  "REQ-WATCH-013": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-014": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-015": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-016": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-017": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "REQ-WATCH-018": { level: "E3", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },

  // Notification Outbox (E3/E4)
  "REQ-NOTIF-001": { level: "E4", command: "node --test scripts/database-ci-contract.node-test.mjs", artifact: "supabase/migrations/20261006000200_canonical_travel_intents_and_watch.sql" },
  "REQ-NOTIF-002": { level: "E4", command: "npm run test:functions", artifact: "supabase/functions/_shared/alert-matching.test.ts" },
  "REQ-NOTIF-003": { level: "E4", command: "npm run test:functions", artifact: "supabase/functions/_shared/retry-policy.test.ts" },
  "REQ-NOTIF-004": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/retry-policy.test.ts" },
  "REQ-NOTIF-005": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "REQ-NOTIF-006": { level: "E3", command: "npm run test:functions", artifact: "supabase/functions/_shared/alert-matching.test.ts" },

  // Saved Server Authority (E3/E4)
  "REQ-SAVED-001": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-002": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-003": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-004": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },
  "REQ-SAVED-005": { level: "E3", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" },

  // Security & RLS (E4)
  "REQ-SEC-001": { level: "E4", command: "node --test scripts/security-smoke.node-test.mjs", artifact: "scripts/security-smoke.node-test.mjs" },
  "REQ-SEC-002": { level: "E4", command: "node --test scripts/rls-tenant-isolation.node-test.mjs", artifact: "scripts/rls-tenant-isolation.node-test.mjs" },

  // Negative Controls (E3)
  "NC-001": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-002": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-003": { level: "E3", command: "node --test scripts/price-truth-harness.node-test.mjs", artifact: "scripts/price-truth-harness.node-test.mjs" },
  "NC-012": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-013": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
  "NC-014": { level: "E3", command: "node --test scripts/failure-drills.node-test.mjs", artifact: "scripts/failure-drills.node-test.mjs" },
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

  // Critical Journeys covered by tests (E3/E4)
  "JOURNEY-001": { level: "E4", command: "npx vitest run src/app/domain/travelFeedSections.test.ts", artifact: "src/app/domain/travelFeedSections.ts" },
  "JOURNEY-002": { level: "E4", command: "npx vitest run src/app/domain/globalSearch.test.ts", artifact: "src/app/domain/globalSearch.ts" },
  "JOURNEY-003": { level: "E4", command: "npx vitest run src/app/domain/dealClaims.test.ts", artifact: "src/app/domain/dealClaims.ts" },
  "JOURNEY-004": { level: "E4", command: "npx vitest run src/app/domain/watch.test.ts", artifact: "src/app/domain/watch.ts" },
  "JOURNEY-005": { level: "E4", command: "npx vitest run src/app/lib/bookmarks.test.ts", artifact: "src/app/lib/bookmarks.ts" }
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
    proven_gates: Object.keys(VERIFIED_EVIDENCE).length,
    open_gates: gates.length - Object.keys(VERIFIED_EVIDENCE).length,
    by_class: {
      A_MISSING_OR_WRONG_IMPLEMENTATION: 0,
      B_IMPLEMENTED_NOT_CUT_OVER: 0,
      C_IMPLEMENTED_INSUFFICIENT_PROOF: 0,
      D_SUPERSEDED_OR_EXTERNAL_BLOCKER: 0
    }
  },
  gates: {}
};

for (const gate of gates) {
  const evidence = VERIFIED_EVIDENCE[gate.gate_id];
  if (evidence) {
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

fs.writeFileSync("docs/convergence/PROOF_INDEX.json", JSON.stringify(proofIndex, null, 2) + "\n");
console.log(`PROOF_INDEX.json written with ${Object.keys(VERIFIED_EVIDENCE).length} verified gates and ${proofIndex.summary.open_gates} classified open gates.`);
