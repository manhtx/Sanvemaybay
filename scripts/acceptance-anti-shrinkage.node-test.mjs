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

export function validateAntiShrinkage(baseline, current) {
  assert.ok(Array.isArray(baseline.gates), "Baseline gates must be an array");
  assert.ok(Array.isArray(current.gates), "Current gates must be an array");
  assert.ok(baseline.gates.length >= 27, "Baseline must define at least 27 gates");

  const currentGateMap = new Map(current.gates.map((g) => [g.gate_id, g]));

  for (const baseGate of baseline.gates) {
    const currentGate = currentGateMap.get(baseGate.gate_id);
    assert.ok(
      currentGate,
      `Gate ${baseGate.gate_id} disappeared! Gates are immutable and cannot be deleted.`
    );

    // Requirement and title integrity
    assert.equal(
      currentGate.title,
      baseGate.title,
      `Title for ${baseGate.gate_id} must not be altered`
    );
    assert.equal(
      currentGate.requirement,
      baseGate.requirement,
      `Requirement for ${baseGate.gate_id} must not be weakened or altered`
    );

    // Priority cannot silently decrease
    const basePriorityRank = PRIORITY_ORDER[baseGate.priority] ?? 99;
    const currentPriorityRank = PRIORITY_ORDER[currentGate.priority] ?? 99;
    assert.ok(
      currentPriorityRank <= basePriorityRank,
      `Priority for ${baseGate.gate_id} weakened from ${baseGate.priority} to ${currentGate.priority}`
    );

    // Evidence level cannot silently decrease
    const baseEvRank = EVIDENCE_LEVEL_ORDER[baseGate.required_evidence_level] ?? -1;
    const currentEvRank = EVIDENCE_LEVEL_ORDER[currentGate.required_evidence_level] ?? -1;
    assert.ok(
      currentEvRank >= baseEvRank,
      `Required evidence level for ${baseGate.gate_id} decreased from ${baseGate.required_evidence_level} to ${currentGate.required_evidence_level}`
    );

    // Acceptance criteria must not be empty or truncated
    assert.ok(
      currentGate.acceptance_criteria && currentGate.acceptance_criteria.length >= 20,
      `Acceptance criteria for ${baseGate.gate_id} cannot be empty or trivially shortened`
    );
  }

  // Current must contain at least as many gates as baseline
  assert.ok(
    current.gates.length >= baseline.gates.length,
    `Current gate count (${current.gates.length}) cannot be less than baseline count (${baseline.gates.length})`
  );
  return true;
}

function loadRegistries() {
  const baselinePath = path.resolve("docs/convergence/IMMUTABLE_ACCEPTANCE_REGISTRY.baseline.json");
  const currentPath = path.resolve("docs/convergence/IMMUTABLE_ACCEPTANCE_REGISTRY.json");
  assert.ok(fs.existsSync(baselinePath), "Baseline acceptance registry must exist");
  assert.ok(fs.existsSync(currentPath), "Current acceptance registry must exist");
  return {
    baseline: JSON.parse(fs.readFileSync(baselinePath, "utf8")),
    current: JSON.parse(fs.readFileSync(currentPath, "utf8")),
  };
}

test("acceptance registry anti-shrinkage enforcement (baseline vs current immutability)", () => {
  const { baseline, current } = loadRegistries();
  const passed = validateAntiShrinkage(baseline, current);
  assert.equal(passed, true);
});

test("acceptance anti-shrinkage: negative control: detecting deleted gate throws AssertionError", () => {
  const { baseline, current } = loadRegistries();
  const deletedGateId = baseline.gates[0].gate_id;
  const mutatedCurrent = {
    ...current,
    gates: current.gates.filter((g) => g.gate_id !== deletedGateId),
  };

  assert.throws(
    () => validateAntiShrinkage(baseline, mutatedCurrent),
    new RegExp(`Gate ${deletedGateId} disappeared!`)
  );
});

test("acceptance anti-shrinkage: negative control: detecting weakened gate priority throws AssertionError", () => {
  const { baseline, current } = loadRegistries();
  const p0Gate = baseline.gates.find((g) => g.priority === "P0");
  assert.ok(p0Gate, "Must have a P0 gate in baseline");

  const mutatedCurrent = {
    ...current,
    gates: current.gates.map((g) =>
      g.gate_id === p0Gate.gate_id ? { ...g, priority: "P2" } : g
    ),
  };

  assert.throws(
    () => validateAntiShrinkage(baseline, mutatedCurrent),
    new RegExp(`Priority for ${p0Gate.gate_id} weakened`)
  );
});

test("acceptance anti-shrinkage: negative control: detecting decreased required evidence level throws AssertionError", () => {
  const { baseline, current } = loadRegistries();
  const highEvGate = baseline.gates.find((g) => g.required_evidence_level === "E4" || g.required_evidence_level === "E5");
  assert.ok(highEvGate, "Must have a gate requiring E4 or E5");

  const mutatedCurrent = {
    ...current,
    gates: current.gates.map((g) =>
      g.gate_id === highEvGate.gate_id ? { ...g, required_evidence_level: "E1" } : g
    ),
  };

  assert.throws(
    () => validateAntiShrinkage(baseline, mutatedCurrent),
    new RegExp(`Required evidence level for ${highEvGate.gate_id} decreased`)
  );
});

test("acceptance anti-shrinkage: negative control: detecting truncated or empty acceptance criteria throws AssertionError", () => {
  const { baseline, current } = loadRegistries();
  const targetGate = baseline.gates[0];

  const mutatedCurrent = {
    ...current,
    gates: current.gates.map((g) =>
      g.gate_id === targetGate.gate_id ? { ...g, acceptance_criteria: "short" } : g
    ),
  };

  assert.throws(
    () => validateAntiShrinkage(baseline, mutatedCurrent),
    new RegExp(`Acceptance criteria for ${targetGate.gate_id} cannot be empty or trivially shortened`)
  );
});

test("acceptance anti-shrinkage: baseline gate cardinality and priority distribution integrity", () => {
  const { baseline } = loadRegistries();
  assert.ok(baseline.gates.length >= 27, `Baseline must have >= 27 gates, found ${baseline.gates.length}`);

  const p0Count = baseline.gates.filter((g) => g.priority === "P0").length;
  const p1Count = baseline.gates.filter((g) => g.priority === "P1").length;
  const p2Count = baseline.gates.filter((g) => g.priority === "P2").length;

  assert.ok(p0Count > 0, "Must have P0 priority gates");
  assert.ok(p1Count > 0, "Must have P1 priority gates");
  assert.ok(p2Count > 0, "Must have P2 priority gates");
  assert.equal(p0Count + p1Count + p2Count, baseline.gates.length, "All gates must have valid P0/P1/P2 priorities");
});
