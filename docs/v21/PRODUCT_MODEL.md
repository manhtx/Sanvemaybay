# FARELY V21 PRODUCT DOMAIN MODEL
**Definitive Domain Specification**
**Status**: Canonical
**Version**: 21.0

---

## 1. Domain Philosophy

Farely is a **precise consumer price instrument**, not a generic travel agency or an AI prediction generator.
Its core user loop is:
```
DISCOVER → UNDERSTAND → WATCH → VERIFY
```

The system separates search intent, point-in-time flight price recordings, multi-dimensional cohorts, durable user monitoring contracts, and user decision objects.

---

## 2. Canonical Objects

### 2.1 `TravelIntent`
Represents what a traveler wants to monitor, search, or accomplish. A TravelIntent can be broader than a single specific flight offer.
```typescript
export interface TravelIntent {
  originCode: string;          // e.g. "HAN"
  destinationCode: string;     // e.g. "BKK" or "DMK", or metropolitan "BKK_ALL"
  tripType: "oneway" | "roundtrip";
  dateFrom?: string | null;    // Earliest departure (YYYY-MM-DD)
  dateTo?: string | null;      // Latest departure or return (YYYY-MM-DD)
  maxStops?: number | null;    // 0 = direct only, 1 = max 1 stop, null = any
  targetPrice?: number | null; // User's price threshold in VND
  cabinClass?: "economy" | "premium_economy" | "business";
}
```

### 2.2 `OfferVariant`
A sufficiently specific travel option that can be uniquely compared over time.
```typescript
export interface OfferVariant {
  originCode: string;
  destinationCode: string;
  departDate: string;          // YYYY-MM-DD
  returnDate?: string | null;  // YYYY-MM-DD (null for oneway)
  airlineCode: string;         // e.g. "VJ", "VN"
  flightNumber?: string | null;// e.g. "VJ901"
  stops: number;               // 0, 1, 2...
  durationMinutes?: number | null;
}
```

### 2.3 `Observation`
A single recorded price point observed from a scan epoch at a specific point in time.
```typescript
export interface Observation {
  id: string;                  // Underlying database UUID
  offer: OfferVariant;
  observedAt: string;          // ISO-8601 timestamp
  scanRunId?: string;          // Scan run identifier
  price: number;               // Observed price in VND
  currency: "VND";
  source: string;              // e.g. "fast_flights_google"
  linkKind: "indicative";
  bookingUrl: string;
}
```

### 2.4 `ComparableCohort`
A defensible group of observations that share the same real travel attributes, used to calculate fair market context.
```typescript
export interface ComparableCohort {
  cohortKey: string;           // e.g. "HAN:BKK:roundtrip:2026-11:direct:short"
  originCode: string;
  destinationCode: string;
  tripType: "oneway" | "roundtrip";
  departMonth: string;         // YYYY-MM
  durationBucket?: "short" | "medium" | "long";
  stopsClass: "direct" | "connecting";
  observations: Observation[];
  sampleSize: number;
  scanEpochCount: number;
  medianPrice: number | null;  // NULL if sampleSize < 5 (no fake medians!)
  isSufficient: boolean;       // true if sampleSize >= 5
}
```

### 2.5 `Opportunity`
The central consumer decision object presented to the user. It combines an active Offer with its ComparableCohort context, evidence sufficiency, freshness, and epistemic cost breakdown.
```typescript
export interface Opportunity {
  id: string;                  // Stable Opportunity Identity: deterministic hash of OfferVariant
  offer: OfferVariant;
  currentObservation: Observation;
  cohort: {
    sampleSize: number;
    scanEpochCount: number;
    medianPrice: number | null;
    deltaPercent: number | null; // e.g. 22 (% cheaper than median)
    sufficiency: "SUFFICIENT" | "INSUFFICIENT";
    explanation: string;
  };
  evidence: {
    tier: "STRONG" | "MODERATE" | "ACCUMULATING";
    label: string;             // "BẰNG CHỨNG MẠNH" | "BẰNG CHỨNG VỪA" | "ĐANG TÍCH LŨY"
    freshnessMinutes: number;
    summaryText: string;       // "14 quan sát · 3 lượt quét · 18 phút trước"
  };
  cost: {
    knownPrice: number;
    estimatedAdditional: number;
    estimatedTotal: number;
    baggageState: "KNOWN" | "ESTIMATED" | "OPTIONAL" | "UNKNOWN";
    totalLabel: "TỔNG ƯỚC TÍNH" | "TỔNG TỐI THIỂU";
  };
  freshness: {
    observedAt: string;
    isFresh: boolean;          // < 24h
    isStale: boolean;          // > 48h
  };
}
```

### 2.6 `Watch`
A durable monitoring contract established by a user around a TravelIntent.
```typescript
export type WatchStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "MATCHED"
  | "PAUSED"
  | "DEGRADED"
  | "EXPIRED"
  | "SYNC_FAILED";

export interface Watch {
  id: string;
  userId?: string | null;
  intent: TravelIntent;
  status: WatchStatus;
  channel: "email" | "telegram";
  email?: string | null;
  lastCheckedAt: string | null;// NULL until first real evaluation!
  lastMatchAt: string | null;
  latestObservedPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2.7 `SavedOpportunity`
A durable logical bookmark preserving the traveler's historical context over time, independent of whether the raw observation was purged.
```typescript
export interface SavedOpportunity {
  id: string;
  userId: string;
  opportunityId: string;       // Stable Opportunity Identity
  savedPrice: number;
  savedAt: string;
  snapshotData: {
    route: { fromCode: string; toCode: string; fromName: string; toName: string };
    dates: { departDate: string; returnDate?: string | null };
    airline: { code: string; name: string };
    flightNumber?: string | null;
    stops: number;
    priceAtSave: number;
    cohortMedianAtSave?: number | null;
    evidenceTierAtSave?: string;
  };
  currentOpportunity?: Opportunity | null; // Resolved dynamically from active generation
}
```

### 2.8 `Verification`
An explicit current-price checking attempt or outcome when transitioning to a provider.
```typescript
export type VerificationOutcome =
  | "PRICE_CONFIRMED"
  | "PRICE_CHANGED"
  | "NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "INCOMPARABLE"
  | "ERROR";

export interface Verification {
  id: string;
  opportunityId: string;
  verifiedAt: string;
  outcome: VerificationOutcome;
  observedPrice: number;
  livePrice?: number | null;
  redirectUrl: string;
}
```

---

## 3. Identity Rules

1. **Stable Opportunity Identity**:
   ```typescript
   export function generateOpportunityId(offer: {
     originCode: string;
     destinationCode: string;
     departDate: string;
     returnDate?: string | null;
     airlineCode: string;
     flightNumber?: string | null;
     stops?: number;
   }): string {
     const parts = [
       offer.originCode.toUpperCase().trim(),
       offer.destinationCode.toUpperCase().trim(),
       offer.departDate.trim(),
       (offer.returnDate || "").trim(),
       offer.airlineCode.toUpperCase().trim(),
       (offer.flightNumber || "").toUpperCase().trim(),
       String(offer.stops ?? 0),
     ];
     return parts.join(":");
   }
   ```
2. **Never** use:
   - Observation UUID
   - Generation ID
   - Price
   - Ephemeral database serial numbers
   as the identity of an Opportunity.

---

## 4. Semantic Debt Retirement

The following legacy concepts are **formally retired and forbidden**:
- `AI risk` / `AI score` / `deal_score` (arbitrary heuristics)
- `AI recommendation` / `automatic WAIT or BUY` labels
- `confidence_percent` (arbitrary percentage pretending to be statistical probability)
- `flash deal` (false urgency)
- `fake seats remaining` / `fake expiry countdowns`
- `taxes included` / `baggage included` without affirmative proof

All decision information presented to travelers must derive strictly from **observable, defensible market evidence**.
