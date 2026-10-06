import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };
const EVIDENCE_LEVEL_ORDER = {
  E0: 0,
  E1: 1,
  E2: 2,
  E3: 3,
  E4: 4,
  E5: 5,
  E6: 6,
  E7: 7,
  E8: 8,
  E9: 9,
};

test("acceptance registry anti-shrinkage enforcement", () => {
  const baselinePath = path.resolve("docs/convergence/IMMUTABLE_ACCEPTANCE_REGISTRY.baseline.json");
  const currentPath = path.resolve("docs/convergence/IMMUTABLE_ACCEPTANCE_REGISTRY.json");

  assert.ok(fs.existsSync(baselinePath), "Baseline acceptance registry must exist");
  assert.ok(fs.existsSync(currentPath), "Current acceptance registry must exist");

  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));

  assert.ok(Array.isArray(baseline.gates), "Baseline gates must be an array");
  assert.ok(Array.isArray(current.gates), "Current gates must be an array");
  assert.ok(baseline.gates.length >= 27, "Baseline must define at least 27 gates");

  const currentGateMap = new Map(current.gates.map((g) => [g.gate_id, g]));

  for (const baseGate of baseline.gates) {
    const currentGate = currentGateMap.get(baseGate.gate_id);
    assert.ok(
      currentGate,
      `Gate ${baseGate.gate_id} disappeared! Gates are immutable and cannot be deleted.`,
    );

    // Requirement and title integrity
    assert.equal(
      currentGate.title,
      baseGate.title,
      `Title for ${baseGate.gate_id} must not be altered`,
    );
    assert.equal(
      currentGate.requirement,
      baseGate.requirement,
      `Requirement for ${baseGate.gate_id} must not be weakened or altered`,
    );

    // Priority cannot silently decrease
    const basePriorityRank = PRIORITY_ORDER[baseGate.priority] ?? 99;
    const currentPriorityRank = PRIORITY_ORDER[currentGate.priority] ?? 99;
    assert.ok(
      currentPriorityRank <= basePriorityRank,
      `Priority for ${baseGate.gate_id} weakened from ${baseGate.priority} to ${currentGate.priority}`,
    );

    // Evidence level cannot silently decrease
    const baseEvRank = EVIDENCE_LEVEL_ORDER[baseGate.required_evidence_level] ?? -1;
    const currentEvRank = EVIDENCE_LEVEL_ORDER[currentGate.required_evidence_level] ?? -1;
    assert.ok(
      currentEvRank >= baseEvRank,
      `Required evidence level for ${baseGate.gate_id} decreased from ${baseGate.required_evidence_level} to ${currentGate.required_evidence_level}`,
    );

    // Acceptance criteria must not be empty or truncated
    assert.ok(
      currentGate.acceptance_criteria && currentGate.acceptance_criteria.length >= 20,
      `Acceptance criteria for ${baseGate.gate_id} cannot be empty or trivially shortened`,
    );
  }

  // Current must contain at least as many gates as baseline
  assert.ok(
    current.gates.length >= baseline.gates.length,
    `Current gate count (${current.gates.length}) cannot be less than baseline count (${baseline.gates.length})`,
  );
});
