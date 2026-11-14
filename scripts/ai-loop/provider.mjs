import { readFile } from 'node:fs/promises';

export function providerConfig(env = process.env) {
  if (!env.AI_BASE_URL) throw new Error('No external AI provider is configured. Use the host-native goal loop with the currently selected Codex/Antigravity model, or explicitly set AI_BASE_URL for api-run.');
  if (/ollama|127\.0\.0\.1:11434|localhost:11434/i.test(env.AI_BASE_URL)) throw new Error('Ollama is not supported. Use the host-native loop with the currently selected model.');
  return {
    baseUrl: env.AI_BASE_URL.replace(/\/$/, ''),
    apiKey: requiredFrom(env, 'AI_API_KEY'),
    model: requiredFrom(env, 'AI_MODEL'),
    temperature: Number(env.AI_TEMPERATURE || 0.2),
    timeoutMs: Number(env.AI_TIMEOUT_MS || 600000),
  };
}

function requiredFrom(env, name) {
  if (!env[name]) throw new Error(`Missing ${name} for explicit api-run`);
  return env[name];
}

export async function complete(messages, options = {}) {
  if (process.env.AI_MOCK === '1') return { content: mockResponse(messages), raw: { mock: true } };
  const config = { ...providerConfig(), ...options };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        messages,
      }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`AI provider ${response.status}: ${body.slice(0, 2000)}`);
    const json = JSON.parse(body);
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider returned no message content');
    return { content, raw: json };
  } finally {
    clearTimeout(timeout);
  }
}

export async function completeWithRetry(messages, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await complete(messages, options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

function mockResponse(messages) {
  const joined = messages.map((message) => message.content || '').join('\n');
  if (joined.includes('implementation-protocol') || joined.includes('Implement, test')) {
    return JSON.stringify({
      summary: 'Mock implementation completed without mutating the project.',
      actions: [{ type: 'run', command: 'node', args: ['--version'] }],
      claims: [{ claim: 'Runtime can execute an action', status: 'verified', evidence: 'node --version' }],
      next: 'research',
    });
  }
  const actions = [
    { actionId: 'A1', type: 'read', domain: 'PRODUCT_USER_BUSINESS', decisionType: 'inspect-source-of-truth', question: 'What is Farely product mission and user promise?', path: '.flycheap/MISSION.md' },
    { actionId: 'A2', type: 'read', domain: 'SYSTEM_ARCHITECTURE', decisionType: 'inspect-contracts', question: 'What contracts and data boundaries constrain fare truth?', path: '.flycheap/ACCEPTANCE_CONTRACT.json' },
    { actionId: 'A3', type: 'search', domain: 'UX_CONTENT_INTERACTION', decisionType: 'locate-journeys', question: 'Where are route, price, provider and notification journeys implemented?', pattern: 'provider|price|route|notification' },
    { actionId: 'A4', type: 'run', domain: 'DELIVERY_OPERATIONS', decisionType: 'verify-runtime', question: 'Does the local runtime command execute and report a retained result?', command: 'node', args: ['--version'] },
  ];
  const evidenceLedger = actions.map((action, index) => ({ id: `E${index + 1}`, actionId: action.actionId, sourceLocator: action.path || action.command || action.pattern, evidenceClass: action.type === 'run' ? 'LOCAL_RUNTIME' : 'LOCAL_CODE', observedResult: `Retained output for ${action.actionId}; inspect the host receipt before trusting this observation.`, limitation: 'AI mock fixture; not production or user evidence.', falsifier: `Re-run ${action.actionId} after changing the referenced source.` }));
  const lensCoverage = ['mission','traveler','journey','value','fare-truth','interaction','accessibility','performance','architecture','security','delivery','evidence'].map((lens, index) => ({ id: `L${String(index + 1).padStart(2, '0')}`, observation: `Farely ${lens} requires source-backed review.`, evidenceIds: ['E1'], sourceLocator: '.flycheap/MISSION.md', consequence: 'A missing contract can mislead implementation.', limitation: 'Fixture does not prove production behavior.', falsifier: 'A targeted runtime or source check disproves the observation.', solution: 'Add the check to the next implementation wave.' }));
  const finding = { id: 'F1', claim: 'Farely claims need explicit source and runtime provenance before implementation.', evidenceIds: ['E1', 'E2'], consequence: 'Without this chain, a green check can be mistaken for product value.' };
  const research = {
    researchQuestion: ['What is the highest-value, source-verifiable Farely improvement across product, system, UX and operations?'],
    systemReview: ['Fixture reviewed mission, acceptance contract, journey search and runtime execution.'],
    subpassCoverage: ['PRODUCT_USER_BUSINESS', 'SYSTEM_ARCHITECTURE', 'UX_CONTENT_INTERACTION', 'DELIVERY_OPERATIONS'],
    lensCoverage, executiveConclusion: ['The fixture is structurally complete but must not be treated as real product evidence.'],
    verifiedFindings: [finding], technicalFindings: [finding], productValueFindings: [finding], rootCauseAnalysis: ['Evidence and product value are often conflated without an explicit provenance boundary.'],
    sourceReceipt: ['.flycheap/MISSION.md', '.flycheap/ACCEPTANCE_CONTRACT.json'], systemAudit: ['Data, UX and delivery surfaces require linked acceptance tests.'], capabilityMatrix: ['Search, fare truth, provider and notification surfaces require independent proof.'],
    riskRegister: ['Unsupported fare or provider claims can mislead travelers.'], decisionRecords: ['Keep claims bounded by retained local evidence.'], verificationPlan: ['Re-run source and runtime checks.'], adversarialReview: ['Try to disprove the finding by changing the source contract.'], completenessAudit: ['All four subpasses and twelve lenses represented.'], roundDelta: ['Baseline fixture; later rounds must re-check and revise it.'], newEvidence: ['E1', 'E2'], revisedClaims: ['Prior completion claims remain untrusted until receipts exist.'], negativeTestPlan: ['Delete a runtime receipt and expect the validator to fail.'],
    findings: [finding], evidenceLedger, rejectedClaims: ['A passing local command proves business value.'], solutions: [{ id: 'S1', findingIds: ['F1'], mechanism: 'Persist action/output receipts and require the graph before synthesis.', affectedFiles: ['scripts/ai-loop/agent.mjs', 'scripts/ai-loop/validate-research-quality.mjs'], acceptanceCriteria: 'Validator rejects a finding without retained output.', verification: 'Run the research audit on a missing-output fixture.', rollback: 'Revert the validator contract.', falsifier: 'A valid graph can be constructed without a receipt. You must record why.' }],
    solutionArchitecture: ['Action ledger -> retained runtime output -> evidence -> finding -> solution -> acceptance.'], alternatives: ['Trusting headings and counts is rejected because it permits template research.'], acceptanceMatrix: ['S1: missing outputId must fail.'], valueHypotheses: [{ id: 'VH1', hypothesis: 'Evidence traceability reduces false completion risk.', falsifier: 'A deliberately disconnected graph passes validation.' }], falsifiers: ['Delete an output receipt and expect the audit to fail.'], limitations: ['Mock only; no external provider, analytics or production evidence.'], nextResearchQuestions: ['Which Farely journey has the highest verified user friction?'], compilerImpact: ['Mastergoal must preserve evidence boundaries.'], finalDecision: ['Continue only after semantic audit passes.'], sourceTypes: ['LOCAL_CODE', 'LOCAL_RUNTIME'], releaseHandoff: ['Carry the evidence graph into implementation.'], provenanceReconciliation: ['No unsupported external claim accepted.'], systemContradictions: ['None observed in fixture.'], visualContentAudit: ['Requires browser evidence in a real round.'], runtimeAcceptanceMatrix: ['Node version command retained.'], boundedProbes: ['Inspect mission and acceptance contract.'], rootCauseMap: ['Evidence boundary -> trust risk -> graph gate.'], adversarialScenarioMatrix: ['Missing output', 'stale source'], implementationWaves: ['Add receipts', 'audit graph'], userJourneyMap: ['Discover -> search -> compare -> save'], uxFrictionRegister: ['Unclear fare confidence'], businessValueAudit: ['Business value remains UNKNOWN without analytics.'], experienceBlueprint: ['Search result requires provenance cue'], productOpportunityBacklog: ['Expose confidence and freshness'], userResearchPlan: ['Interview travelers'], businessExperimentPlan: ['Measure alert usefulness'],
  };
  return JSON.stringify({ summary: 'Mock semantic research fixture with retained-action requirements.', research, actions, claims: [finding], next: 'stop' });
}

export async function completeFromFile(systemFile, userMessage, options = {}) {
  const system = await readFile(systemFile, 'utf8');
  return complete([
    { role: 'system', content: system },
    { role: 'user', content: userMessage },
  ], options);
}
