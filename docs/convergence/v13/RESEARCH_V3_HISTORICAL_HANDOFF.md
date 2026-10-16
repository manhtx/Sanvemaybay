# RESEARCH V3 HISTORICAL HANDOFF & CONTRACT RECORD

## Executive Summary
This document establishes the verified historical baseline of Farely Project 10X.
It contains the foundational 20 systemic findings (V3-N01..V3-N20) and tracks the 89 capability contracts (F00..F88).

### Architectural Precedence
- V15 precision solutions build upon and add to V14.
- V14 corrective contracts build upon and resolve V13.
- V13 preserves all foundational Research V1..V3 invariants.
- No requirement may be silently dropped, weakened, or renamed.

### Core Domain Rules
1. **Mathematical Truth**: The cheapest eligible offer is determined strictly by arithmetic minimum within the defined PriceScope fingerprint.
2. **Epistemic Honesty**: Unknown costs, baggage policies, and flight durations must remain explicitly UNKNOWN.
3. **Four-Part Flight Identity**: Separate PhysicalItinerary, CommercialOffer, FareObservation, and Opportunity.
4. **Outbox Precedes Side Effect**: External notifications must be committed to the database outbox before worker dispatch.
5. **No Self-Certification**: Every status claim must be backed by an executed probe with exit code 0.
