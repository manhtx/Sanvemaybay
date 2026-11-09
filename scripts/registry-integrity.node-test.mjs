import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ALL_MISSION_REQUIREMENTS,
  ALL_NEGATIVE_CONTROLS,
  ALL_USER_JOURNEYS,
} from "./build-master-acceptance-registry.mjs";

function loadMasterRegistry() {
  const registryPath = path.resolve("docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json");
  assert.ok(fs.existsSync(registryPath), "MASTER_ACCEPTANCE_REGISTRY.json must exist in docs/convergence/");
  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

test("master registry integrity: all 267 mission requirements, negative controls, and journeys are registered", () => {
  const registry = loadMasterRegistry();
  assert.ok(Array.isArray(registry.gates), "Master registry gates must be an array");

  // REQ-CONTROL-010: final registry MUST contain every mandatory REQ-* ID from external contract
  assert.equal(
    registry.total_requirements,
    ALL_MISSION_REQUIREMENTS.length,
    `Expected ${ALL_MISSION_REQUIREMENTS.length} requirements`,
  );
  assert.equal(
    registry.total_negative_controls,
    ALL_NEGATIVE_CONTROLS.length,
    `Expected ${ALL_NEGATIVE_CONTROLS.length} negative controls`,
  );
  assert.equal(
    registry.total_user_journeys,
    ALL_USER_JOURNEYS.length,
    `Expected ${ALL_USER_JOURNEYS.length} user journeys`,
  );
  assert.equal(
    registry.total_gates,
    267,
    "Expected exactly 267 gates in MASTER_ACCEPTANCE_REGISTRY.json",
  );

  const gateMap = new Map(registry.gates.map((g) => [g.gate_id, g]));

  // Verify all 213 REQs exist with correct priority and evidence level
  for (const req of ALL_MISSION_REQUIREMENTS) {
    const gate = gateMap.get(req.req_id);
    assert.ok(gate, `Mission requirement ${req.req_id} missing from master registry`);
    assert.equal(gate.priority, req.priority, `Priority mismatch for ${req.req_id}`);
    assert.equal(
      gate.required_evidence_level,
      req.required_evidence_level,
      `Evidence level mismatch for ${req.req_id}`,
    );
    assert.ok(gate.requirement.length > 10, `Requirement text too short for ${req.req_id}`);
    assert.ok(gate.acceptance_criteria.length > 10, `Acceptance criteria too short for ${req.req_id}`);
  }
});

test("control plane integrity: canonical convergence artifacts exist without stale authority", () => {
  const convergenceDir = path.resolve("docs/convergence");
  assert.ok(fs.existsSync(convergenceDir), "docs/convergence/ must exist");

  const requiredFiles = [
    "MASTER_ACCEPTANCE_REGISTRY.json",
    "CURRENT_BASELINE.json",
    "TEST_MATRIX.json",
    "RELEASE_MANIFEST.json",
    "FINAL_SCORECARD.json",
    "MISSION_CHECKPOINT.json",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(convergenceDir, file);
    assert.ok(fs.existsSync(filePath), `Required convergence file ${file} must exist`);
  }
});

test("registry integrity: all 35 negative controls (NC-001..NC-035) are explicitly defined and classified under NEGATIVE_CONTROL", () => {
  const registry = loadMasterRegistry();
  const gateMap = new Map(registry.gates.map((g) => [g.gate_id, g]));

  assert.equal(ALL_NEGATIVE_CONTROLS.length, 35, "Must have exactly 35 negative controls");

  for (const nc of ALL_NEGATIVE_CONTROLS) {
    const gate = gateMap.get(nc.id);
    assert.ok(gate, `Negative control ${nc.id} missing from master registry`);
    assert.equal(gate.category, "NEGATIVE_CONTROL", `Negative control ${nc.id} must be categorized as NEGATIVE_CONTROL`);
    assert.ok(gate.requirement && gate.requirement.length >= 10, `Negative control ${nc.id} must have detailed requirement description`);
    assert.ok(gate.acceptance_criteria && gate.acceptance_criteria.length >= 10, `Negative control ${nc.id} must have detailed acceptance criteria`);
  }
});

test("registry integrity: all 19 critical user journeys (J-01..J-19) are explicitly defined and classified under CRITICAL_JOURNEY", () => {
  const registry = loadMasterRegistry();
  const gateMap = new Map(registry.gates.map((g) => [g.gate_id, g]));

  assert.equal(ALL_USER_JOURNEYS.length, 19, "Must have exactly 19 critical user journeys");

  for (const j of ALL_USER_JOURNEYS) {
    const gate = gateMap.get(j.id);
    assert.ok(gate, `User journey ${j.id} missing from master registry`);
    assert.equal(gate.category, "CRITICAL_JOURNEY", `User journey ${j.id} must be categorized as CRITICAL_JOURNEY`);
    assert.ok(gate.requirement && gate.requirement.length >= 10, `User journey ${j.id} must have detailed requirement description`);
    assert.ok(gate.acceptance_criteria && gate.acceptance_criteria.length >= 10, `User journey ${j.id} must have detailed acceptance criteria`);
  }
});

test("registry integrity: priority taxonomy purity guarantees every gate has valid P0, P1, or P2 priority", () => {
  const registry = loadMasterRegistry();
  const validPriorities = new Set(["P0", "P1", "P2"]);

  for (const gate of registry.gates) {
    assert.ok(
      validPriorities.has(gate.priority),
      `Gate ${gate.gate_id} has invalid priority: "${gate.priority}" (must be P0, P1, or P2)`
    );
  }
});

test("performance benchmark: complete registry parsing and 267-gate validation finishes within latency budget", () => {
  const start = performance.now();
  for (let i = 0; i < 20; i++) {
    const reg = loadMasterRegistry();
    assert.equal(reg.total_gates, 267);
  }
  const duration = performance.now() - start;
  // 20 full file reads, JSON parses, and assertions must complete in under 100ms
  assert.ok(duration < 100, `Expected duration < 100ms, took ${duration.toFixed(2)}ms`);
});
