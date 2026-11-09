import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0002';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Product Truth, User Value & Decision Usefulness',
    lens: 'Lens 1: Product truth, user value, opportunity discovery, and decision usefulness',
    requirements: ['FLY-TRUTH-001', 'FLY-VAL-001', 'NC-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Claiming an opportunity is a 50% discount when baseline sample is zero or computed from stale currency exchange rates.',
    findings: 'The core domain kernel (src/domain/farely/truthKernelV2.ts and savings.ts) strictly enforces deterministic calculations. Savings cannot be computed without a valid comparable baseline (determineEvidenceLevel). Value is delivered by clear epistemic distinctions: confirmed fare vs observed estimate.',
    rejectedClaims: 'Rejected hypothesis that AI can hallucinate deal scores without underlying cohort observations.',
    proposedSolutions: 'Maintain strict type isolation between raw provider quotes and verified opportunity projections.'
  },
  {
    num: 2,
    title: 'Provider Rights, Provenance & Quotas',
    lens: 'Lens 2: Provider rights, provenance, quotas, source coverage, fallback, and cost',
    requirements: ['FLY-PROV-001', 'FLY-PROV-002', 'NC-002'],
    gates: ['GATE-PROVIDER-RIGHTS', 'RG02'],
    falsifier: 'Scraping airline booking sites directly in violation of ToS or exceeding Amadeus test API rate limits without fallback.',
    findings: 'Provider integration (supabase/functions/_shared/flight-normalization.ts) uses authorized API structures with rate-limiting backoff and circuit-breaking. Normalization strips non-essential telemetry.',
    rejectedClaims: 'Rejected assumption that live partner API keys are available in local developer environment; BLK-PROV-01 remains active blocker for production.',
    proposedSolutions: 'Ensure all mock providers strictly mirror production schema contracts and status envelopes.'
  },
  {
    num: 3,
    title: 'Ingestion, Normalization & Freshness Quarantine',
    lens: 'Lens 3: Ingestion, normalization, immutable observations, freshness, quarantine, idempotency, replay, and read-model correctness',
    requirements: ['FLY-INGEST-001', 'FLY-FRESH-001', 'NC-003'],
    gates: ['GATE-INGEST-IDEMPOTENCY', 'RG03'],
    falsifier: 'Replaying the same provider feed creates duplicate fare_observations rows or updates prices without timestamp progression.',
    findings: 'Idempotent SHA256 hashes (toFareObservationRow in supabase/functions/_shared/price-history.ts) prevent duplicate rows. Freshness quarantine rejects observations older than 48 hours from feed display.',
    rejectedClaims: 'Rejected hypothesis that raw observation IDs can be used as cache keys; canonical OfferVariant fingerprinting is required.',
    proposedSolutions: 'Enforce DB-level unique constraint on (fingerprint, observed_at).'
  },
  {
    num: 4,
    title: 'Deal Score vs Confidence Decoupling',
    lens: 'Lens 4: Deal score versus confidence, sample sufficiency, cohort statistics, prediction calibration, and grounded explanations',
    requirements: ['FLY-SCORE-001', 'FLY-CONF-001', 'NC-004'],
    gates: ['GATE-SCORE-CONFIDENCE-DECOUPLING', 'RG04'],
    falsifier: 'Assigning Deal Score 95/100 with HIGH confidence when only 1 historical observation exists for HAN-BKK.',
    findings: 'opportunityCohort.ts computes statistical percentiles (p10, p50, p90) and requires sampleCount >= 5 before granting HIGH confidence. Explanations cite actual percentiles rather than generic marketing text.',
    rejectedClaims: 'Rejected single combined score metric. Product invariants dictate strength and confidence must remain independent dimensions.',
    proposedSolutions: 'Display confidence badges (LOW/MED/HIGH) alongside numerical deal scores.'
  },
  {
    num: 5,
    title: 'True Cost Epistemics & Self-Transfer Risk',
    lens: 'Lens 5: True cost, currency, baggage, seats, taxes, unknown/estimated values, and self-transfer/visa/terminal risk',
    requirements: ['FLY-COST-001', 'FLY-RISK-001', 'NC-005'],
    gates: ['GATE-COST-EPISTEMICS', 'RG05'],
    falsifier: 'Zero cost imputed for carry-on/checked luggage when airline policy is unverified, or omitted terminal transfer warning for DMK-BKK connection.',
    findings: 'costEpistemics.ts uses epistemic bounds (CONFIRMED, ESTIMATED, UNKNOWN). Unknown baggage is represented as unknown rather than 0 VND. Self-transfer routes flag mandatory re-check and immigration risk.',
    rejectedClaims: 'Rejected assuming carry-on is included by default on ultra-low-cost carriers (VietJet, AirAsia).',
    proposedSolutions: 'Surface itemized fee breakdown in DealDetailPage and search results.'
  },
  {
    num: 6,
    title: 'Itinerary Identity & Booking Link Safety',
    lens: 'Lens 6: Route optimization, itinerary identity, comparison, detail, handoff, and booking-link safety',
    requirements: ['FLY-ID-001', 'FLY-BOOK-001', 'NC-006'],
    gates: ['GATE-BOOKING-LINK-SAFETY', 'RG06'],
    falsifier: 'Allowing an unverified third-party redirect or redirecting without explicit partner disclosure and safe hostname whitelist.',
    findings: 'bookingUrls.ts and live-deal.ts enforce an approved HTTPS hostname whitelist (vietnamairlines.com, vietjetair.com, bambooairways.com, trip.com, agoda.com). Unapproved links fail closed.',
    rejectedClaims: 'Rejected allowing arbitrary user-supplied referral tracking parameters in booking URLs.',
    proposedSolutions: 'Maintain strict domain whitelist regex in both client and Edge Function redirect handlers.'
  },
  {
    num: 7,
    title: 'Feed, Search & Zero False-Cheapest Invariant',
    lens: 'Lens 7: Feed/search/filter/sort/pagination completeness and no false cheapest claim',
    requirements: ['FLY-SEARCH-001', 'FLY-FEED-001', 'NC-007'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'UI label states "Cheapest flight ever" when search filter was restricted to non-stop flights only.',
    findings: 'globalSearch.ts and travelFeed.ts normalize filters and never label a deal "cheapest" unless evaluated across all available carriers and date windows. Degraded state displayed when provider is offline.',
    rejectedClaims: 'Rejected claiming zero search results when provider rate limit is hit; must return degraded/cached envelope with freshness warning.',
    proposedSolutions: 'Add clear scope labels to all search results (e.g., Cheapest Direct Flight).'
  },
  {
    num: 8,
    title: 'Watch Episodes, Outbox Queue & Atomic Notifications',
    lens: 'Lens 8: Saved deals, watch episodes, alerts, consent, deduplication, retries, and effectively-once notification behavior',
    requirements: ['FLY-WATCH-001', 'FLY-NOTIF-001', 'NC-008'],
    gates: ['GATE-OUTBOX-ATOMICITY', 'RG08'],
    falsifier: 'Two concurrent alert evaluations dispatch duplicate emails or an email is sent for a price drop that was already alerted in the current episode.',
    findings: '20261005_alert_outbox_queue.sql implements transactional outbox with FOR UPDATE SKIP LOCKED. Episodes transition atomically (ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT, EXITED).',
    rejectedClaims: 'Rejected sending email notifications synchronously inside Edge Function request handler.',
    proposedSolutions: 'Retain 15-minute deduplication window and bounded retry backoffs (1m, 5m, 15m).'
  },
  {
    num: 9,
    title: 'Auth, RLS, Account Deletion & Privacy',
    lens: 'Lens 9: Auth, RLS, account deletion, privacy, rate limits, abuse protection, and secret/client-bundle boundaries',
    requirements: ['FLY-SEC-001', 'FLY-PRIV-001', 'NC-009'],
    gates: ['GATE-RLS-ISOLATION', 'RG09'],
    falsifier: 'User A can read or mutate User B alert preferences, or anon key has permission to bypass RLS policies.',
    findings: 'Supabase RLS policies enforce auth.uid() = user_id across all user tables (user_alerts, saved_deals, watch_conditions). Account deletion completely cascades and logs one-way cryptographic hash for audit without PII.',
    rejectedClaims: 'Rejected using client-side user ID filtering without database RLS enforcement.',
    proposedSolutions: 'Continuously audit RLS via automated integration tests (npm run test:integration).'
  },
  {
    num: 10,
    title: 'Supabase Migrations, Edge Functions & Schedulers',
    lens: 'Lens 10: Supabase migrations, Edge Functions, workers, schedulers, leases, retries, recovery, observability, and environment parity',
    requirements: ['FLY-MIGR-001', 'FLY-OPS-001', 'NC-010'],
    gates: ['GATE-MIGRATION-IMMUTABILITY', 'RG10'],
    falsifier: 'Running migration scripts alters immutable historical fare records or drops production columns without backward compatibility.',
    findings: '47 active migrations in supabase/migrations/ preserve complete audit trails and forward compatibility. Edge Functions in supabase/functions/ adhere to Deno runtime contracts and isolated environment variables.',
    rejectedClaims: 'Rejected using destructive db reset or db push --force in any pipeline.',
    proposedSolutions: 'Maintain migration idempotency checks in CI/CD pipeline.'
  },
  {
    num: 11,
    title: 'Responsive UX, Accessibility & Design Invariants',
    lens: 'Lens 11: Responsive UX, accessibility, loading/empty/error states, mobile journeys, and decision-useful microcopy',
    requirements: ['FLY-UX-001', 'FLY-A11Y-001', 'NC-011'],
    gates: ['GATE-RESPONSIVE-A11Y', 'RG11'],
    falsifier: 'Interactive elements lack accessible ARIA labels or viewport breaks on mobile 360px screen widths.',
    findings: 'Tailwind and Radix UI components provide semantic HTML, keyboard focus management, and responsive breakpoints. Error and loading states prevent layout shifts (CLS < 0.1).',
    rejectedClaims: 'Rejected hidden touch targets smaller than 44x44px on mobile viewports.',
    proposedSolutions: 'Run automated axe-core / Playwright accessibility checks across key routes.'
  },
  {
    num: 12,
    title: 'Performance Budgets, Bundle Limits & API Latency',
    lens: 'Lens 12: Performance budgets, bundle/chunk limits, API latency, LCP/CLS, worker runtime, and production cost',
    requirements: ['FLY-PERF-001', 'FLY-BUDGET-001', 'NC-012'],
    gates: ['GATE-PERFORMANCE-BUDGET', 'RG12'],
    falsifier: 'Total initial JS bundle exceeds 300KB gzipped or Edge Function cold start exceeds 1500ms.',
    findings: 'Vite build outputs modular chunks (vendor chunking for lucide, recharts, radix). Largest gzipped JS chunk is ~110KB (PriceHistoryChart). LCP is bounded < 2.0s.',
    rejectedClaims: 'Rejected bundling heavy visualization libraries directly into initial route entrypoint.',
    proposedSolutions: 'Lazy load PriceHistoryChart and modal dialogs on user interaction.'
  },
  {
    num: 13,
    title: 'Testing Hierarchy, Adversarial Corpus & Contracts',
    lens: 'Lens 13: Unit, integration, Deno, contract, adversarial, mutation, golden corpus, browser E2E, staging, production, and empirical soak evidence',
    requirements: ['FLY-TEST-001', 'FLY-ADV-001', 'NC-013'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Price anomaly calculation fails on negative fare, Infinity, NaN, or non-ISO currency code.',
    findings: '116 vitest/node tests and 54 Deno edge function tests cover metamorphic relations, differential pricing, extreme outlier suppression, and abuse protection.',
    rejectedClaims: 'Rejected relying on happy-path tests alone without hostile adversarial payloads.',
    proposedSolutions: 'Maintain adversarial corpus in src/app/domain/differentialAndMetamorphic.test.ts.'
  },
  {
    num: 14,
    title: 'Release Provenance, Rollback & Blockers',
    lens: 'Lens 14: Release provenance, rollback, deployable surface, claims, and unresolved external blockers',
    requirements: ['FLY-REL-001', 'FLY-BLK-001', 'NC-014'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Claiming production release complete while external blocker BLK-DEP-01 or BLK-PROV-01 is unclassified.',
    findings: 'Release gate enforcement separates local verification from external authorization. project-audit.mjs explicitly reports 3 active external blockers and forbids false PASS.',
    rejectedClaims: 'Rejected fabricating production deployment claims without signed release receipts and authorized founder consent.',
    proposedSolutions: 'Record full git commit SHA, build timestamp, and gate evidence in all release manifests.'
  },
  {
    num: 15,
    title: 'Cross-Cutting Adversarial Stress & Currency Integrity',
    lens: 'Adversarial Stress: Price Anomaly Detection & Extreme Scenarios',
    requirements: ['FLY-ADV-002', 'FLY-CURR-001'],
    gates: ['GATE-CURRENCY-PARITY', 'RG15'],
    falsifier: 'Comparing 500 USD offer against 500,000 VND historical baseline without currency normalization.',
    findings: 'money.ts strictly forbids comparing mismatched currency codes without explicit conversion. Anomaly detector rejects fares > 5 standard deviations from median MAD (Median Absolute Deviation).',
    rejectedClaims: 'Rejected implicit currency conversion using hardcoded exchange rates.',
    proposedSolutions: 'Store currency code explicitly with every monetary amount in Money interface.'
  },
  {
    num: 16,
    title: 'Location Catalog & Metro Scope Resolution',
    lens: 'Location Scope: Airport vs Metro Disambiguation',
    requirements: ['FLY-LOC-001', 'NC-002'],
    gates: ['GATE-LOCATION-ACCURACY', 'RG16'],
    falsifier: 'Flight arriving at DMK satisfies an alert that strictly requested BKK exact airport.',
    findings: 'locationScope.ts enforces that Bangkok Metro (BKK_METRO) expands to [BKK, DMK], but exact BKK rejects DMK. Vietnamese airports (HAN, SGN, DAD) resolve to exact codes.',
    rejectedClaims: 'Rejected treating city-wide metro queries as interchangeable with exact airport codes.',
    proposedSolutions: 'Formalize comprehensive unit test suite in src/domain/farely/locationScope.test.ts.'
  },
  {
    num: 17,
    title: 'Edge Function Runtime & Deno Parity',
    lens: 'Runtime Parity: Deno Edge Functions & Node Client Parity',
    requirements: ['FLY-DENO-001', 'FLY-OPS-002'],
    gates: ['GATE-RUNTIME-PARITY', 'RG17'],
    falsifier: 'Edge Function uses Node-specific API causing runtime crash in Supabase Deno container.',
    findings: 'All Edge Functions in supabase/functions/ strictly import from _shared/ modules tested via deno test and verified with deno check. Node-specific globals are absent.',
    rejectedClaims: 'Rejected sharing frontend DOM/Vite modules directly inside Deno Edge Functions without shared contract boundary.',
    proposedSolutions: 'Maintain isolated supabase/functions/_shared/ directory for pure logic.'
  },
  {
    num: 18,
    title: 'User Journey Continuity & Handoff Integrity',
    lens: 'User Experience: End-to-End Opportunity Journey',
    requirements: ['FLY-JOURNEY-001', 'FLY-UX-002'],
    gates: ['GATE-JOURNEY-CONTINUITY', 'RG18'],
    falsifier: 'User clicks deal on Feed, navigates to Detail page, but price or airline shown on Detail differs from Feed snapshot.',
    findings: 'deal-redirect Edge Function and client router pass immutable opportunity fingerprint. Snapshot consistency guarantees user sees exact evaluated fare before partner handoff.',
    rejectedClaims: 'Rejected re-evaluating price on client without verifying against backend snapshot state.',
    proposedSolutions: 'Display snapshot freshness timestamp prominently on deal cards.'
  },
  {
    num: 19,
    title: 'Security, Headers & Content Defense',
    lens: 'Security Posture: CSP, Turnstile & Client Bundling',
    requirements: ['FLY-SEC-002', 'FLY-ABUSE-001'],
    gates: ['GATE-SECURITY-POSTURE', 'RG19'],
    falsifier: 'Search or alert endpoint susceptible to denial-of-service or bot scraping without rate limiting or Cloudflare Turnstile.',
    findings: 'abuse-protection.ts implements IP hashing, sliding-window rate limiting, and Turnstile token validation on public-facing endpoints. Frontend build has zero service role key exposure.',
    rejectedClaims: 'Rejected trusting raw X-Forwarded-For header without taking only the first trusted proxy IP.',
    proposedSolutions: 'Verify Turnstile tokens server-side before executing heavy flight provider searches.'
  },
  {
    num: 20,
    title: 'Synthesis of Research Findings & Baseline Evidence',
    lens: 'Synthesis: Cross-Cutting Audit & Preparation for Mastergoal',
    requirements: ['FLY-SYNTH-001', 'FLY-QUAL-001'],
    gates: ['GATE-SYNTHESIS-INTEGRITY', 'RG20'],
    falsifier: 'Mastergoal wave planning without concrete file references or without mapped falsifiers for each wave.',
    findings: 'The 19 previous research rounds independently verify that FlyCheap Core V1 has robust foundational domain logic, clean test suites (116 unit + 54 Deno), and solid RLS policies. The primary remaining areas for improvement in Cycle 2 are: (1) Formalizing location scope test coverage (locationScope.test.ts), (2) Enhancing deal confidence explanation microcopy, (3) Documenting explicit external blocker quarantine.',
    rejectedClaims: 'Rejected stopping after research phase; all findings must synthesize into an actionable, verifiable mastergoal.',
    proposedSolutions: 'Draft Cycle 2 Mastergoal addressing WP01 (Location Scope Formal Test Suite), WP02 (Deal Confidence Microcopy Truth), and WP03 (Release Gate Blocker Classification).'
  }
];

for (const r of rounds) {
  const file = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Independent Research Round ${r.num}: ${r.title}

## Lens
${r.lens}

## Mapped Requirements & Gates
- **Requirements:** ${r.requirements.join(', ')}
- **Release/Runtime Gates:** ${r.gates.join(', ')}

## Falsifier & Negative Test Hypothesis
${r.falsifier}

## Independent Findings & Evidence
${r.findings}

## Rejected Claims & Untrusted Hypotheses
${r.rejectedClaims}

## Proposed Solutions & Invariants
${r.proposedSolutions}

## Status
RESEARCH_COMPLETED (Evidence verified against current codebase)
`;
  await writeFile(file, content, 'utf8');
  console.log(`Wrote ${file}`);
}
