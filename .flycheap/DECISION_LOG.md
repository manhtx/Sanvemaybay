# FlyCheap AI — Architecture & Contract Decision Log

## Decision 1: Freeze Product Scope to Core V1 Boundary
- **Date:** 2026-09-24
- **Context:** The prompt establishes a hard Prime Directive to build, integrate, verify, and harden Core FlyCheap without infinite feature drift.
- **Decision:** Frozen 33 acceptance requirements in `ACCEPTANCE_CONTRACT.json` across 5 categories: `data_provider`, `intelligence`, `user_experience`, `security_privacy`, and `operations_resilience`.
- **Non-Goals explicitly locked:** No airline ticketing issuance, no payment processing, no passport storage, no car/hotel marketplace, no native app, no autonomous purchasing, no bot-evasive scraping.
- **Impact:** Any new feature proposal must be deferred to post-V1 unless strictly required to satisfy an existing P0 acceptance criterion or fix a safety defect.

## Decision 2: Separate Deal Score from Confidence
- **Date:** 2026-09-24
- **Context:** Extreme discounts (e.g. 70% below baseline) observed from a single unverified source or with sample size n=1 can produce catastrophic false positives.
- **Decision:** Formula for Deal Score (magnitude of discount + rarity) is calculated independently from Confidence Score (sample size + provider trust + age). Fares with Confidence < 50% are capped at modest labels ("Giá đáng chú ý") and prohibited from "Deal cực nóng" or top alert dispatch.
- **Impact:** Prevents promotion of scraping glitches or single-source outliers to users.

## Decision 3: Deterministic Data Truth Dominates AI
- **Date:** 2026-09-24
- **Context:** AI hallucination in flight search destroys user trust and risks financial harm.
- **Decision:** Prices, dates, routes, airlines, baggage rules, true cost calculations, risk scores, and buy/wait recommendations are calculated 100% deterministically by structured code. AI (via `ai-explainer`) is restricted to summarizing and explaining why an offer is attractive, using only validated input JSON. If LLM calls fail or timeout, the core application degrades gracefully with pure rule-based explanations.
- **Impact:** Eliminates hallucinated fares; guarantees system reliability when external AI providers experience outages.

## Decision 4: Honest Freshness Lifecycle vs False Real-Time Claims
- **Date:** 2026-09-24
- **Context:** Flight fares fluctuate rapidly; displaying stale fares as fresh causes user frustration when prices disappear on airline checkout.
- **Decision:** Every observation is explicitly categorized:
  - `HEALTHY`: <= 120 minutes old (fresh).
  - `DEGRADED_FRESHNESS`: 121 to 360 minutes old (visible with cautionary badge).
  - `STALE_ONLY`: > 360 minutes old (clearly labeled historical/stale with explicit prompt to recheck live airline prices).
- **Impact:** Protects user trust; prevents misleading "live" claims when scans are delayed.

## Decision 5: Anti-Abuse and Privacy-Preserving Deletion
- **Date:** 2026-09-24
- **Context:** Public alert creation and telemetry endpoints can be exploited by bots; users have GDPR/privacy rights to data export and deletion.
- **Decision:**
  - Alert creation requires Cloudflare Turnstile token validation and atomic rate-limiting with salted SHA-256 IP/email budgets.
  - Account deletion is server-authoritative and transactional via `manage-user-data`, requiring explicit confirmation "DELETE_MY_ACCOUNT" and writing a one-way hashed audit log.
- **Impact:** Resilient against abuse while fulfilling strict data privacy standards.
