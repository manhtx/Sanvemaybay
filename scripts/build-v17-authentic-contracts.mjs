/**
 * Script to build the authentic Owner-Locked F00-F88 Capability Contracts
 * and compute the Semantic Drift Matrix against the altered GitHub baseline.
 */
import fs from 'node:fs';

const authenticCapabilities = [
  {
    id: "F00",
    tier: "P0",
    title: "Independent proof authority",
    solution: "Gate-level executed assertions, trustworthy raw receipts, source dependency digests and independent owner admission.",
    acceptance: "A forged PASS, parent SHA proof or tampered result cannot close an unrelated mandatory gate."
  },
  {
    id: "F01",
    tier: "P0",
    title: "One release manifest",
    solution: "Versioned runtime tuple covering frontend, source commit, database, Edge Functions, worker, scheduled jobs and active generation.",
    acceptance: "Historical preview and production SHAs do not falsely reconcile."
  },
  {
    id: "F02",
    tier: "P0",
    title: "Four canonical identities",
    solution: "Separate PhysicalItinerary, CommercialOffer, FareObservation and Opportunity with versioned IDs and migration aliases.",
    acceptance: "Distinct flights do not merge; Saved and Watch retain identity through generation rollover."
  },
  {
    id: "F03",
    tier: "P0",
    title: "Full TravelIntent",
    solution: "Typed trip kind, airport/city scope, outbound/inbound dates, travelers, cabin, stop requirements, baggage and price basis.",
    acceptance: "A full UI→API→DB→worker→decision round trip loses no material travel intent field."
  },
  {
    id: "F04",
    tier: "P0",
    title: "Unknown semantics",
    solution: "Use explicit KNOWN, UNKNOWN and NOT_APPLICABLE semantics across source, price and travel data.",
    acceptance: "Unknown stop count, baggage and tax are never silently coerced to zero."
  },
  {
    id: "F05",
    tier: "P0",
    title: "Provider evidence registry",
    solution: "Versioned provider mode, capability, license/terms, source age, parser state, quota and fallback policy.",
    acceptance: "HTTP 429/503 or parser failure cannot produce QUALIFIED_EMPTY."
  },
  {
    id: "F06",
    tier: "P0",
    title: "Coverage certificate",
    solution: "Scan proof bound to exact query scope, provider, dates, partition outcomes, generation and time.",
    acceptance: "Unscanned or partially scanned dates cannot be represented as verified no-fare results."
  },
  {
    id: "F07",
    tier: "P0",
    title: "Demand-aware worker",
    solution: "Union all active eligible Watch scopes before prioritizing under quotas, with bounded fairness, leases and retries.",
    acceptance: "Watch scopes outside the old first-N candidate slice receive their defined service opportunity."
  },
  {
    id: "F08",
    tier: "P0",
    title: "Atomic dataset generation",
    solution: "Candidate manifest, committed row-count reconciliation, transactional pointer publication and last-known-good fallback.",
    acceptance: "Crash or partial ingestion cannot expose mixed or false-complete generations."
  },
  {
    id: "F09",
    tier: "P0",
    title: "Authoritative search",
    solution: "Apply eligibility, full-universe filters, sort and count before cursor pagination on the server.",
    acceptance: "An eligible offer beyond the first 120, 1,500 or 5,000 rows remains discoverable and correctly ranked."
  },
  {
    id: "F10",
    tier: "P0",
    title: "Best/lowest truth",
    solution: "Arithmetic minimum across fully eligible comparable offers under one PriceScope, with separate unknown/excluded candidate counts.",
    acceptance: "Different cabins, passenger mixes, return dates or unknown required fees cannot be compared as one exact total."
  },
  {
    id: "F11",
    tier: "P0",
    title: "Comparable pricing",
    solution: "Exact PriceScope cohorts, independent scan epochs, duplicate controls and non-self-comparison. For STRONG historical claims preserve the original threshold: at least 12 independent comparable observations and at least 3 scan epochs, subject to original contract verification.",
    acceptance: "Multiple records from one scan never manufacture STRONG historical evidence."
  },
  {
    id: "F12",
    tier: "P0",
    title: "Explainable price label",
    solution: "Separate price exceptionality, freshness, confidence, evidence strength, cost uncertainty and journey fit.",
    acceptance: "Low-evidence prices cannot receive authoritative discount or lowest-ever claims."
  },
  {
    id: "F13",
    tier: "P0",
    title: "History/Matrix",
    solution: "Same-offer time-series by observed_at; departure-date matrix by travel_date; comparable cohort as separate product.",
    acceptance: "Departure date never masquerades as observation timestamp."
  },
  {
    id: "F14",
    tier: "P0",
    title: "Opportunity Detail",
    solution: "Primary deal card enters Farely's own stable Opportunity Decision Detail; external provider verification is a subsequent CTA.",
    acceptance: "Card opens the correct durable opportunity with evidence and alternatives."
  },
  {
    id: "F15",
    tier: "P0",
    title: "Saved lifecycle",
    solution: "Persist stable opportunity reference, saved-price snapshot, observed time, current state, expiry, alias migration and account ownership.",
    acceptance: "Saved survives refresh and correctly shows stale/replaced/invalidated opportunities."
  },
  {
    id: "F16",
    tier: "P0",
    title: "Watch & notification",
    solution: "Qualified Watch transition -> durable outbox -> provider acceptance -> delivery evidence where available -> deduped retry.",
    acceptance: "No duplicate logical notification episode; no strong price alert based on invalid coverage."
  },
  {
    id: "F17",
    tier: "P0",
    title: "Security/privacy",
    solution: "RLS, grants, RPC access, private credentials, consent, account deletion and bounded public APIs.",
    acceptance: "Tenant-crossing and privileged RPC abuse tests fail closed."
  },
  {
    id: "F18",
    tier: "P0",
    title: "Performance & accessibility",
    solution: "Actual hydrated browser tests, accessible forms/focus, real Web Vitals where measurable and manual critical journey review.",
    acceptance: "No critical user-flow accessibility blocker; report measured numbers instead of fabricated performance scores."
  },
  {
    id: "F19",
    tier: "P0",
    title: "Production release/soak",
    solution: "Authorized release process, exact deployment tuple, reversible rollout and at least 24 hours of actual runtime continuity for the historical soak gate.",
    acceptance: "Synthetic time-series or forged elapsed time cannot satisfy longitudinal proof."
  },
  {
    id: "F20",
    tier: "P0",
    title: "End-to-end anti-regression",
    solution: "Real-module tests, integration, browser journeys, database replay, adversarial faults and preservation proofs.",
    acceptance: "Critical user journeys survive changes without accepted regression."
  },
  {
    id: "F21",
    tier: "P1",
    title: "Budget-first Everywhere Explore",
    solution: "Origin + maximum budget + flexible travel period -> destination groups from fully covered eligible scopes.",
    acceptance: "Do not derive minimum price from first-page results or incomplete markets without a coverage warning."
  },
  {
    id: "F22",
    tier: "P1",
    title: "Flexible Date Matrix",
    solution: "Per-date observed minimum with same PriceScope, source age, cohort integrity and coverage status.",
    acceptance: "Missing cells show UNKNOWN, never 0₫ or invented fare."
  },
  {
    id: "F23",
    tier: "P1",
    title: "Airport alternatives",
    solution: "Nearby airport suggestions with actual transfer time/cost sources or explicitly labeled estimates.",
    acceptance: "Compare grounded air fare savings against travel inconvenience, not price-only airport swaps."
  },
  {
    id: "F24",
    tier: "P1",
    title: "Personal value of time",
    solution: "Optional disclosed user preferences for duration, stops and inconvenience; keep objective cheapest independent.",
    acceptance: "Turning preferences off restores transparent price ranking."
  },
  {
    id: "F25",
    tier: "P1",
    title: "Opportunity rationale",
    solution: "Expose sample count, independent epochs, comparable cohort, exclusions, observation age and claim ceiling.",
    acceptance: "A user can understand how Farely reached a recommendation."
  },
  {
    id: "F26",
    tier: "P1",
    title: "Price verification step",
    solution: "Clearly distinguish observed price, indicative CTA and provider-repriced quote when available.",
    acceptance: "Measure reported price match/mismatch, never infer a completed booking from a click."
  },
  {
    id: "F27",
    tier: "P1",
    title: "Watch setup from intent",
    solution: "Prepopulate and explicitly preview exact TravelIntent, departure/return conditions, price, expiry and cadence.",
    acceptance: "No silent modification of trip dates or traveler composition."
  },
  {
    id: "F28",
    tier: "P1",
    title: "Saved comparison board",
    solution: "Compare 2–4 saved compatible opportunities by verified cost fields, schedule, conditions, age and uncertainties.",
    acceptance: "No unknown information silently promoted to known."
  },
  {
    id: "F29",
    tier: "P1",
    title: "Fare movement timeline",
    solution: "Observed price history over time, with raw observations and missing-scan gaps.",
    acceptance: "Chart cannot use travel departure dates as historical observation dates."
  },
  {
    id: "F30",
    tier: "P1",
    title: "Fare recheck feedback",
    solution: "Accept user-reported matched, changed or unavailable price with source and timestamp.",
    acceptance: "Feedback remains USER_REPORTED until independently verified."
  },
  {
    id: "F31",
    tier: "P1",
    title: "Decision modes",
    solution: "Separate Cheapest Observed, Convenient, Budget Fit and Lower Risk rankings.",
    acceptance: "Users can inspect ranking reasons and return to objective price sort."
  },
  {
    id: "F32",
    tier: "P1",
    title: "Discovery empty/degraded recovery",
    solution: "Separate provider unavailable, no scan, partial coverage, genuinely no eligible offer and stale state.",
    acceptance: "Provider 503 does not show generic \"không tìm thấy vé\"."
  },
  {
    id: "F33",
    tier: "P1",
    title: "Vietnamese-first travel language",
    solution: "Natural Vietnamese UI for price units, observed-age, local date/time, baggage, airline and fare conditions.",
    acceptance: "Real user tasks show comprehension of data limitations."
  },
  {
    id: "F34",
    tier: "P1",
    title: "Digest and noise control",
    solution: "Instant/daily/weekly cadence, quiet hours, per-episode suppression, unsubscribe and delivery health.",
    acceptance: "No duplicate notifications and measurable alert burden."
  },
  {
    id: "F35",
    tier: "P1",
    title: "Data provenance UI",
    solution: "Compact source/age/evidence badges with detailed provenance on demand.",
    acceptance: "Users distinguish observed vs verified vs unavailable."
  },
  {
    id: "F36",
    tier: "P2",
    title: "Trust-calibrated Buy/Wait guidance",
    solution: "Longitudinal train/test split, forecast calibration, naive-baseline comparison and confidence limits.",
    acceptance: "Return insufficient_data until real out-of-sample evidence supports stronger guidance."
  },
  {
    id: "F37",
    tier: "P2",
    title: "Price anomaly detection",
    solution: "Robust seasonal/change-point analysis with measured precision@K and false-deal rate.",
    acceptance: "Never make strong anomaly claims on insufficient sample."
  },
  {
    id: "F38",
    tier: "P2",
    title: "Personalized travel feed",
    solution: "Explicit preference opt-in, privacy controls and controlled retention/saved-outcome evaluation.",
    acceptance: "No sensitive inference or covert profiling."
  },
  {
    id: "F39",
    tier: "P2",
    title: "Weekend escape templates",
    solution: "Schedule-aware weekends, local holidays, departure/arrival time and known fare coverage.",
    acceptance: "Templates must be possible and based on observed supporting data."
  },
  {
    id: "F40",
    tier: "P2",
    title: "Group/family fare planning",
    solution: "Correct traveler ages, baggage, seats and total-party fare scope.",
    acceptance: "Single-adult price cannot be shown as family total."
  },
  {
    id: "F41",
    tier: "P2",
    title: "Multi-city itinerary",
    solution: "Explicit multi-slice TravelIntent and provider-supported itinerary coherence.",
    acceptance: "No joining unrelated one-way tickets into a fictitious single purchasable offer."
  },
  {
    id: "F42",
    tier: "P2",
    title: "Deal curation and editorial collections",
    solution: "Human-reviewable collections based on evidence, freshness and expiry.",
    acceptance: "No fabricated scarcity or unsupported featured discount."
  },
  {
    id: "F43",
    tier: "P2",
    title: "Direct/affiliate provider comparison",
    solution: "Compare actual provider quote basis, refresh state, link class, partner rights and disclosures.",
    acceptance: "Commercial ranking does not override undisclosed objective cheapest result."
  },
  {
    id: "F44",
    tier: "P2",
    title: "Anonymous -> account continuity",
    solution: "Explicit consent-based guest-to-account Saved/Watch transfer with identity isolation.",
    acceptance: "No silent cross-account merge."
  },
  {
    id: "F45",
    tier: "P2",
    title: "Sharing, referrals and viral loops",
    solution: "Public links without personal information, bounded abuse controls and measurable acquisition outcomes.",
    acceptance: "No PII leaks or misleading stale deal shares."
  },
  {
    id: "F46",
    tier: "P2",
    title: "Explore by total trip budget",
    solution: "Include hotel and ground components only with source-supported data; preserve uncertainty.",
    acceptance: "No exact trip-total claim with unknown material costs."
  },
  {
    id: "F47",
    tier: "P2",
    title: "Partner integrations",
    solution: "Provider capability, live repricing, commercial permission, reliability and unit-economics evaluation.",
    acceptance: "No source enabled commercially without supporting rights and economics."
  },
  {
    id: "F48",
    tier: "P2",
    title: "Mobile-first PWA and push",
    solution: "Offline-safe experience, permission/consent, cache certainty protection and Watch-driven notification value.",
    acceptance: "Offline observed fares cannot appear as freshly available deals."
  },
  {
    id: "F49",
    tier: "P3",
    title: "AI travel copilot",
    solution: "LLM uses typed verified tools and deterministic price computation. No hallucinated prices, routes or available seats.",
    acceptance: "Empirical usefulness and factual grounding must beat simpler workflows before public activation."
  },
  {
    id: "F50",
    tier: "P3",
    title: "Historical fare forecasting",
    solution: "Longitudinal unbiased observation data and rolling-horizon backtesting.",
    acceptance: "No forecasting launch without evidence of calibration and practical value."
  },
  {
    id: "F51",
    tier: "P3",
    title: "Subscription/premium Watch",
    solution: "Proven recurring alert value, compliant billing, cancellation, support and consent.",
    acceptance: "No paid launch without commercial and product authorization."
  },
  {
    id: "F52",
    tier: "P3",
    title: "Full ticket checkout",
    solution: "Licensed issuing/fulfillment, booking provider integration, payment, refunds and support.",
    acceptance: "No direct checkout launch without authorized supplier and operational responsibility."
  },
  {
    id: "F53",
    tier: "P3",
    title: "B2B Fare Intelligence API",
    solution: "Explicit source redistribution rights, commercial quota, billing and quality SLA.",
    acceptance: "No B2B data resale based merely on the license of a scraper library."
  },
  {
    id: "F54",
    tier: "P3",
    title: "Credit-card / promotion optimization",
    solution: "Actual provider payable price + accurate card/promotion terms and effective periods.",
    acceptance: "No invented savings or irrelevant cashback catalog."
  },
  {
    id: "F55",
    tier: "P3",
    title: "International language and market expansion",
    solution: "Provider country rights, currency handling, localized policy and operational support.",
    acceptance: "No market release without supported data and service model."
  },
  {
    id: "F56",
    tier: "P0",
    title: "Authenticated Watch scoping",
    solution: "Remote tenant-owned Watch records are authoritative for signed-in users; guest cache must be isolated.",
    acceptance: "Account A logout -> Account B login shows no A Watch/email."
  },
  {
    id: "F57",
    tier: "P0",
    title: "Watch mutation acknowledgement",
    solution: "Server-authoritative idempotent pause/resume/delete and UI rollback.",
    acceptance: "403/500/offline cannot result in confirmed success UI."
  },
  {
    id: "F58",
    tier: "P0",
    title: "Typed WatchDateScope",
    solution: "Distinct outboundDateFrom/To, returnDateFrom/To, duration and any-date monitoring horizon.",
    acceptance: "Return date never becomes outbound window end."
  },
  {
    id: "F59",
    tier: "P0",
    title: "No invented observation time",
    solution: "Separate provider_observed_at, fetched_at and processed_at; preserve unknown provider time.",
    acceptance: "Unknown timestamp cannot be converted into \"just observed\"."
  },
  {
    id: "F60",
    tier: "P0",
    title: "Provider date provenance",
    solution: "Dates must originate from supported provider data and be validated.",
    acceptance: "Request date alone cannot certify physical flight date."
  },
  {
    id: "F61",
    tier: "P1",
    title: "One-way/roundtrip support boundary",
    solution: "Typed capability matrix for each provider.",
    acceptance: "One-way request never silently becomes round-trip."
  },
  {
    id: "F62",
    tier: "P0",
    title: "Immutable response coverage identity",
    solution: "Each response includes scope fingerprint, source mode, coverage IDs and generation.",
    acceptance: "A partial result page cannot claim full-market coverage."
  },
  {
    id: "F63",
    tier: "P0",
    title: "Watch visibility & truthful SLA",
    solution: "Show last checked, actual scan health, expected next evaluation and degraded status.",
    acceptance: "Stalled Watch cannot appear recently evaluated."
  },
  {
    id: "F64",
    tier: "P0",
    title: "Notification observed-at fidelity",
    solution: "Every price-specific alert references actual source observation and time.",
    acceptance: "Missing observation ID prevents a strong fare notification."
  },
  {
    id: "F65",
    tier: "P0",
    title: "Source mode quarantine",
    solution: "Separate OBSERVED_SCRAPE, CACHED_PRICE, LIVE_SEARCH and REPRICED modes.",
    acceptance: "Cached fares cannot be labeled purchasable live inventory."
  },
  {
    id: "F66",
    tier: "P0",
    title: "Currency and price scope integrity",
    solution: "Persist ISO currency, traveler mix, price unit and FX source/time when converted.",
    acceptance: "No cross-currency cheapest claim without suitable conversion evidence."
  },
  {
    id: "F67",
    tier: "P1",
    title: "Baggage/fare-rule uncertainty",
    solution: "Known mandatory fees, optional fees, estimates and unknowns are separate.",
    acceptance: "Unknown baggage is not free or included."
  },
  {
    id: "F68",
    tier: "P1",
    title: "Airport and local datetime correctness",
    solution: "IATA airport vs metro scope, timezone-aware flight instants and overnight connections.",
    acceptance: "Cross-timezone or same-city airport alternatives are evaluated correctly."
  },
  {
    id: "F69",
    tier: "P0",
    title: "Canonical client data adapters",
    solution: "Typed adapters preserve null/unknown instead of Number(x)||0 coercion.",
    acceptance: "Unknown values survive API -> UI -> Saved -> Watch -> notification."
  },
  {
    id: "F70",
    tier: "P0",
    title: "Watch source quorum and parser mode",
    solution: "Monitor parser/partition outcomes before certifying successful empty search.",
    acceptance: "Zero rows + parse failure = provider failure, not verified empty."
  },
  {
    id: "F71",
    tier: "P0",
    title: "Demand scheduler guarantees",
    solution: "Full active Watch demand union precedes candidate limit and quota selection.",
    acceptance: "Watch route beyond first-N tracked routes is not silently starved."
  },
  {
    id: "F72",
    tier: "P1",
    title: "Exact vs indicative CTA gate",
    solution: "Use exact deep links only when validated and allowed; generic/expired links disclose limits.",
    acceptance: "Generic search link cannot be labeled exact offer purchase."
  },
  {
    id: "F73",
    tier: "P0",
    title: "Browser-cache staleness ceiling",
    solution: "Cache entries carry observed timestamp, fetched timestamp, source and TTL.",
    acceptance: "A 7-day-old cache is never shown as a fresh fare."
  },
  {
    id: "F74",
    tier: "P0",
    title: "Cross-user analytics and privacy",
    solution: "Session/auth-bound pseudonymous analytics and logout cleanup.",
    acceptance: "No Watch/email leakage through browser caches or queued events."
  },
  {
    id: "F75",
    tier: "P1",
    title: "Verification reconciliation feedback",
    solution: "Capture observed price vs user/provider recheck result with valid denominators.",
    acceptance: "No booking or price-match success inferred from mere external clicks."
  },
  {
    id: "F76",
    tier: "P1",
    title: "Transparent partnership ranking",
    solution: "Separate editorial/affiliate promotion from objective cheapest ranking.",
    acceptance: "Changing referral revenue cannot silently change price sort."
  },
  {
    id: "F77",
    tier: "P0",
    title: "Secret and quota hygiene",
    solution: "Server-only secrets, redacted logs, safe provider quotas, rate limits, circuit breakers.",
    acceptance: "No secret leaks; quota 429 handled without false data truth."
  },
  {
    id: "F78",
    tier: "P0",
    title: "Synthetic-proof adversary",
    solution: "Gate-bound assertions, source hashes, real elapsed receipts and mutation detection.",
    acceptance: "Forged timestamps or parent SHA cannot prove new runtime behavior."
  },
  {
    id: "F79",
    tier: "P1",
    title: "Visual intent task tests",
    solution: "Actual tasks: find, compare, save, Watch, verify and understand data status.",
    acceptance: "Measurable task success/confusion; screenshots alone are insufficient."
  },
  {
    id: "F80",
    tier: "P1",
    title: "Compact evidence-led cards",
    solution: "Price basis, observed age, source class and uncertainty in progressive UI.",
    acceptance: "Users understand observed fare may change before booking."
  },
  {
    id: "F81",
    tier: "P1",
    title: "PWA operational safeguards",
    solution: "Offline-safe caching, secret safety and stale-data warnings.",
    acceptance: "Offline state cannot elevate cached fare certainty."
  },
  {
    id: "F82",
    tier: "P1",
    title: "Deal invalidation and lifecycle",
    solution: "Stable historical opportunity, expired/replaced states and compatible alternatives.",
    acceptance: "Saved opportunity does not disappear or point to a different physical flight."
  },
  {
    id: "F83",
    tier: "P0",
    title: "End-to-end after schema upgrade",
    solution: "Forward-compatible DB migrations and Edge/function signature checks.",
    acceptance: "Old/new consumer compatibility proven in isolated integration."
  },
  {
    id: "F84",
    tier: "P0",
    title: "Real notification receipt chain",
    solution: "Watch match -> durable outbox -> provider acceptance -> signed delivery event where supported.",
    acceptance: "Provider accepted is not delivered; logical episodes deduplicated."
  },
  {
    id: "F85",
    tier: "P1",
    title: "Provider source rights registry",
    solution: "Track source scraping terms, display, caching, redistribution and affiliate rights.",
    acceptance: "No premium/B2B redistribution without actual rights."
  },
  {
    id: "F86",
    tier: "P2",
    title: "Vietnam-specific travel UX",
    solution: "Vietnamese airport names, VND, baggage options, holidays and local transport context.",
    acceptance: "Localized real-data user tasks."
  },
  {
    id: "F87",
    tier: "P2",
    title: "Intent-based itinerary group planner",
    solution: "Group/family/multi-leg planning only with compatible trip and price units.",
    acceptance: "No one-person price promoted to total family fare."
  },
  {
    id: "F88",
    tier: "P2",
    title: "Data economics optimizer",
    solution: "Track cost per scanned scope, eligible offer, verified opportunity and useful Watch event.",
    acceptance: "No scan expansion without measured marginal value."
  }
];

// Read historical altered mapping
const historicalPath = 'docs/convergence/forensics/HISTORICAL_ALTERED_MAPPING.json';
const historicalList = JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
const historicalMap = new Map(historicalList.map(c => [c.id, c]));

// Compute drift matrix
const driftMatrix = [];
let priorityMismatchCount = 0;
let titleMismatchCount = 0;

for (const auth of authenticCapabilities) {
  const altered = historicalMap.get(auth.id);
  const isPriorityMismatch = altered ? altered.tier !== auth.tier : true;
  const isTitleMismatch = altered ? altered.title !== auth.title : true;
  if (isPriorityMismatch) priorityMismatchCount++;
  if (isTitleMismatch) titleMismatchCount++;

  driftMatrix.push({
    id: auth.id,
    authentic_tier: auth.tier,
    authentic_title: auth.title,
    altered_tier: altered?.tier ?? null,
    altered_title: altered?.title ?? null,
    priority_shifted: isPriorityMismatch,
    title_shifted: isTitleMismatch,
    authentic_solution: auth.solution,
    authentic_acceptance: auth.acceptance
  });
}

console.log(`Computed drift matrix: ${priorityMismatchCount} priority mismatches, ${titleMismatchCount} title mismatches.`);

// Update docs/convergence/v13/LOCKED_RESEARCH_CONTRACT.json
const v13Path = 'docs/convergence/v13/LOCKED_RESEARCH_CONTRACT.json';
const v13Data = JSON.parse(fs.readFileSync(v13Path, 'utf8'));
v13Data.capability_contracts = authenticCapabilities.map(c => ({
  id: c.id,
  tier: c.tier,
  title: c.title,
  solution: c.solution,
  acceptance: c.acceptance,
  status: "LOCKED_OWNER_AUTHORITY"
}));
fs.writeFileSync(v13Path, JSON.stringify(v13Data, null, 2));
console.log(`Updated ${v13Path} with ${authenticCapabilities.length} authentic capability contracts.`);

// Write docs/convergence/v17/SEMANTIC_DRIFT_MATRIX.json
fs.mkdirSync('docs/convergence/v17', { recursive: true });
fs.writeFileSync('docs/convergence/v17/SEMANTIC_DRIFT_MATRIX.json', JSON.stringify({
  version: "17.0.0",
  contract_id: "FARELY-V17-SEMANTIC-DRIFT-MATRIX",
  analyzed_at: new Date().toISOString(),
  total_capabilities: 89,
  priority_mismatch_count: priorityMismatchCount,
  title_mismatch_count: titleMismatchCount,
  discrepancies: driftMatrix
}, null, 2));
console.log(`Wrote docs/convergence/v17/SEMANTIC_DRIFT_MATRIX.json.`);
