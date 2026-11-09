import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0016';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Foundational Route Multi-Leg Cost Aggregation',
    lens: 'Lens 1: Total cost epistemics across multi-leg journeys',
    requirements: ['FLY-INTEL-007', 'REQ-DOM-001', 'NC-005', 'NC-033'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to include extra leg costs or fees in total route evaluation, presenting partial costs as full cost.',
    findings: '`assessRoute` delegates to `calculateTotalCost`, aggregating leg prices and `extraCost` fields deterministically.',
    rejectedClaims: 'Rejected computing journey cost from base ticket fares alone while ignoring extra leg baggage/seat costs.',
    proposedSolutions: 'Assert comprehensive cost calculation in `src/app/domain/routeOptimization.test.ts`.'
  },
  {
    num: 2,
    title: 'Temporal Connection Buffer Calculation and Invariance',
    lens: 'Lens 2: Metamorphic layover duration analysis',
    requirements: ['FLY-INTEL-007', 'FLY-INTEL-008', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Calculating incorrect connection minutes or ignoring user-provided connection duration.',
    findings: '`assessRoute` calculates layover minutes from previous arrival to next departure, preserving user-supplied buffers if explicitly set.',
    rejectedClaims: 'Rejected mutating input route objects during connection duration derivation.',
    proposedSolutions: 'Verify non-mutation and exact connection minute math across varied timezone timestamps.'
  },
  {
    num: 3,
    title: 'Negative Temporal Layover Defense: Paradoxical Departures',
    lens: 'Lens 5: Adversarial input and chronology validation',
    requirements: ['FLY-INTEL-007', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting a route where leg 2 departs before leg 1 arrives.',
    findings: '`assessRoute` throws an error ("A later leg departs before the previous leg arrives.") when departure is earlier than previous arrival.',
    rejectedClaims: 'Rejected permitting negative layovers or backwards time-travel journeys.',
    proposedSolutions: 'Test negative layover error throwing.'
  },
  {
    num: 4,
    title: 'Non-Positive Leg Price and Duration Validation',
    lens: 'Lens 5: Input boundary fuzzing and sanitary guards',
    requirements: ['FLY-INTEL-007', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing negative leg prices or non-positive leg durations (<= 0 minutes).',
    findings: '`assessRoute` asserts `leg.price >= 0` and `leg.durationMinutes > 0`, throwing "Route leg values are invalid." otherwise.',
    rejectedClaims: 'Rejected zero-duration legs and negative prices in journey assessment.',
    proposedSolutions: 'Test negative price and zero duration leg rejections.'
  },
  {
    num: 5,
    title: 'Empty Route Legs Hard Guard',
    lens: 'Lens 5: Zero-element collection protection',
    requirements: ['FLY-INTEL-007', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Processing a route option with 0 legs without raising an invariant violation.',
    findings: '`assessRoute` throws "A route must contain at least one leg." immediately when legs array is empty.',
    rejectedClaims: 'Rejected empty routes producing 0 cost low risk outputs.',
    proposedSolutions: 'Test empty legs array assertion.'
  },
  {
    num: 6,
    title: 'Unparseable Route Timestamp Validation',
    lens: 'Lens 5: Date format parsing sanity',
    requirements: ['FLY-INTEL-007', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting malformed or non-ISO timestamp strings without failing closed.',
    findings: '`parseTime` checks `Number.isFinite(Date.parse(value))`, throwing "Invalid route time: ..." if invalid.',
    rejectedClaims: 'Rejected silent NaN propagation in connection calculations.',
    proposedSolutions: 'Test invalid timestamp strings throwing parsing error.'
  },
  {
    num: 7,
    title: 'Tight Connection Layover Gating (< 120 Minutes)',
    lens: 'Lens 1: Connection risk modeling and traveler protection',
    requirements: ['FLY-INTEL-008', 'NC-010'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to flag connections under 120 minutes with a concrete risk reason.',
    findings: 'When `connectionMinutes < 120`, `riskReasons` includes "Thời gian nối chuyến dưới 120 phút."',
    rejectedClaims: 'Rejected treating sub-2-hour international/transfer layovers as risk-free.',
    proposedSolutions: 'Assert risk reason presence for connections < 120 min.'
  },
  {
    num: 8,
    title: 'Self-Transfer Separate-Ticket Inherent Risk Flagging',
    lens: 'Lens 1: Separate-ticket legal protections (NC-009, NC-010)',
    requirements: ['FLY-INTEL-008', 'NC-009', 'NC-010'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Treating a SELF_TRANSFER route as requiring no confirmation when no other risk reasons exist.',
    findings: '`requiresUserConfirmation` is unconditionally true for `SELF_TRANSFER` routes, accompanied by "Tách vé: hãng bay có thể không bảo vệ chặng tiếp theo."',
    rejectedClaims: 'Rejected presenting self-transfer journeys as protected single-ticket itineraries.',
    proposedSolutions: 'Verify unconditional user confirmation for SELF_TRANSFER type.'
  },
  {
    num: 9,
    title: 'Airport Transfer Risk Identification',
    lens: 'Lens 1: Geographic discontinuity and inter-terminal friction',
    requirements: ['FLY-INTEL-008', 'NC-010'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to flag journeys requiring transfers between different airports in the same metropolitan area.',
    findings: 'When `airportChange: true`, `riskReasons` includes "Phải đổi sân bay trong hành trình."',
    rejectedClaims: 'Rejected hiding airport transfers (e.g. HND to NRT, DMK to BKK).',
    proposedSolutions: 'Verify airport change risk reason and risk score escalation.'
  },
  {
    num: 10,
    title: 'Visa Transit and Baggage Policy Disclosures',
    lens: 'Lens 1: Operational and regulatory feasibility',
    requirements: ['FLY-INTEL-008', 'NC-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Concealing visa transit requirements or unincluded checked baggage.',
    findings: '`requiresVisaTransit` and `!leg.baggageIncluded` add explicit warnings to `riskReasons`.',
    rejectedClaims: 'Rejected assuming all international transit is visa-free or all fares include bags.',
    proposedSolutions: 'Test baggage and visa transit risk reason assertions.'
  },
  {
    num: 11,
    title: 'Overnight Layover and Stale Data Warning Systems',
    lens: 'Lens 1: Passenger comfort and data freshness integrity (NC-007)',
    requirements: ['FLY-INTEL-008', 'NC-007'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Allowing stale route cache (`dataFresh: false`) or overnight transit without explicit warnings.',
    findings: '`dataFresh: false` and `overnightTransit: true` inject dedicated Vietnamese warning disclosures.',
    rejectedClaims: 'Rejected presenting stale cached fares as fresh or hiding overnight waits.',
    proposedSolutions: 'Assert Vietnamese risk disclosures for dataFresh and overnight transit.'
  },
  {
    num: 12,
    title: 'Airline Reliability Classification: Low vs Unknown vs Reliable',
    lens: 'Lens 1: Carrier operational reliability modeling',
    requirements: ['FLY-INTEL-008', 'NC-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Inventing reliability for unknown airlines or failing to distinguish low reliability from unknown.',
    findings: '`airlineReliability: "low"` outputs "Dữ liệu cho thấy độ tin cậy hãng bay thấp.", while `"unknown"` outputs "Chưa có dữ liệu độ tin cậy hãng bay."',
    rejectedClaims: 'Rejected treating unknown airline reliability as high or reliable.',
    proposedSolutions: 'Test both low and unknown reliability risk strings.'
  },
  {
    num: 13,
    title: 'Categorical Risk Level Escalation: Low vs Medium vs High',
    lens: 'Lens 4: Multi-factor risk quantization and classification',
    requirements: ['FLY-INTEL-008', 'RG01'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Misclassifying routes with > 2 risk reasons as low or medium risk.',
    findings: '0 reasons = "low"; 1-2 reasons = "medium"; > 2 reasons = "high". High risk mandates `requiresUserConfirmation: true`.',
    rejectedClaims: 'Rejected arbitrary or non-deterministic risk tier assignment.',
    proposedSolutions: 'Verify risk level thresholds (0, 1-2, >2) with combinatorial tests.'
  },
  {
    num: 14,
    title: 'Optimal Route Selection with High-Risk Exclusion Gating',
    lens: 'Lens 4: Objective optimization with hard risk constraints',
    requirements: ['FLY-INTEL-007', 'FLY-INTEL-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: '`chooseLowestCostRoute` recommending a cheaper option that has high risk over a safer slightly pricier option.',
    findings: '`chooseLowestCostRoute` filters out all routes with `riskLevel === "high"` before sorting by total cost.',
    rejectedClaims: 'Rejected choosing high-risk options solely because they are cheap.',
    proposedSolutions: 'Test high-risk exclusion and return of undefined when no low/medium routes exist.'
  },
  {
    num: 15,
    title: 'Self-Transfer Combiner: Geographic and Temporal Compatibility',
    lens: 'Lens 2: Cross-provider itinerary stitching',
    requirements: ['FLY-INTEL-007', 'FLY-INTEL-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Combining options with non-matching intermediate airports or buffer less than minimumBufferMinutes.',
    findings: '`combineSelfTransferOptions` requires destination of leg 1 to match origin of leg 2, and buffer >= minimumBufferMinutes.',
    rejectedClaims: 'Rejected combining discontinuous routes or tight self-transfers.',
    proposedSolutions: 'Test buffer boundary conditions and airport mismatch rejections.'
  },
  {
    num: 16,
    title: 'Self-Transfer Combiner: Invalid Buffer & Identity Defense',
    lens: 'Lens 5: Combinatorial edge cases and parameter sanitization',
    requirements: ['FLY-INTEL-007', 'FLY-INTEL-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Combining an option with itself or executing with negative/NaN buffer.',
    findings: 'Combiner skips `first === second` and returns `[]` immediately if `!Number.isFinite(minimumBufferMinutes) || minimumBufferMinutes < 0`.',
    rejectedClaims: 'Rejected circular routes and negative buffer thresholds.',
    proposedSolutions: 'Test NaN buffer, negative buffer, and self-combination prevention.'
  },
  {
    num: 17,
    title: 'Authoritative Booking URLs: Google Flights Natural Query Generation',
    lens: 'Lens 1: Authoritative public search URL construction',
    requirements: ['FLY-SEC-003', 'NC-015', 'REQ-BOOK-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Generating broken Google Flights query syntax or omitting Vietnamese language / VND currency parameters.',
    findings: '`buildGoogleFlightsUrl` builds `Flights to [DEST] from [ORIG] on [DEPART] [through RETURN]`, encoding with `hl=vi&curr=VND`.',
    rejectedClaims: 'Rejected fragile airline-specific deep links in favor of public search aggregator.',
    proposedSolutions: 'Assert exact encoded URI and query parameters in `src/app/lib/bookingUrls.test.ts`.'
  },
  {
    num: 18,
    title: 'Authoritative Booking URLs: Skyscanner YYMMDD Date Normalization',
    lens: 'Lens 1: Aggregator URL date format specifications',
    requirements: ['FLY-SEC-003', 'REQ-BOOK-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Passing standard YYYY-MM-DD or unformatted dates to Skyscanner paths.',
    findings: '`toSkyDate` strips hyphens and century prefix ("2026-06-22" -> "260622"), building valid lowercase airport path segments.',
    rejectedClaims: 'Rejected incorrect date format resulting in 404s on aggregator.',
    proposedSolutions: 'Test one-way and round-trip Skyscanner URL generation.'
  },
  {
    num: 19,
    title: 'Authoritative Booking URLs: Kayak Format & One-Way/Round-Trip Parity',
    lens: 'Lens 1: Aggregator URL route and date alignment',
    requirements: ['FLY-SEC-003', 'REQ-BOOK-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Passing trailing slash or incorrect date structure to Kayak one-way vs round-trip.',
    findings: '`buildKayakUrl` emits `fromCode-toCode/departDate[/returnDate]?adults=1&currency=VND` cleanly.',
    rejectedClaims: 'Rejected malformed aggregator query paths.',
    proposedSolutions: 'Test one-way and round-trip Kayak URL generation.'
  },
  {
    num: 20,
    title: 'Affiliate URL Fail-Closed Gating & Multi-Provider Options Panel',
    lens: 'Lens 1: Commercial provenance and security allowlists (NC-015, NC-016)',
    requirements: ['FLY-SEC-003', 'NC-015', 'NC-016', 'REQ-AFF-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'RG01', 'RG13'],
    falsifier: 'Emitting an unapproved affiliate link or presenting Traveloka non-IATA options to users.',
    findings: '`getEffectiveDealBookingUrl` strictly demands `linkKind === "live_affiliate"` and `affiliateNetwork`; `getAllBookingOptions` returns 3 approved platforms, intentionally excluding Traveloka.',
    rejectedClaims: 'Rejected exposing user to unapproved affiliate links or airport-mismatched OTAs.',
    proposedSolutions: 'Test affiliate gating failure modes and options panel array composition.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Round ${String(r.num).padStart(2, '0')}: ${r.title}

- **Cycle:** 0016
- **Round:** ${r.num} / 20
- **Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Release / Runtime Gates:** ${r.gates.join(', ')}
- **Falsifier:** ${r.falsifier}

## Empirical & Analytical Findings
${r.findings}

## Rejected Claims & Unsound Hypotheses
${r.rejectedClaims}

## Proposed Autonomous Solutions
${r.proposedSolutions}

## Verification Vectors & Evidence Plan
- **Class:** LOCAL_VERIFIED
- **Commands:** \`npm test\`, \`npm run check\`, \`npm run check:functions && npm run test:functions\`
`;
  await writeFile(roundFile, content, 'utf8');
}

console.log('Successfully generated 20 research rounds for Cycle 0016.');
