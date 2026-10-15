/**
 * Rule 4 & Section D4/E-WP13: Conditional Growth Safety & P3 Governance
 *
 * Governs the 7 P3 future commercial capabilities:
 * - F49: AI travel copilot
 * - F50: Historical fare forecasting (implemented with bounded limitations)
 * - F51: Subscription/premium Watch
 * - F52: Full ticket checkout
 * - F53: B2B Fare Intelligence API
 * - F54: Credit-card / promotion optimization (implemented with eligibility validation)
 * - F55: International language and market expansion
 *
 * Invariant: P2/P3 capabilities requiring external licenses or operational support
 * CANNOT be marked LIVE or activated without explicit prerequisite evidence and Founder authorization.
 */

export class UnauthorizedP3ActivationError extends Error {
  constructor(message: string) {
    super(`[P3_UNAUTHORIZED_GROWTH_ACTIVATION_VIOLATION] ${message}`);
    this.name = 'UnauthorizedP3ActivationError';
  }
}

export type P3CapabilityId = 'F49' | 'F50' | 'F51' | 'F52' | 'F53' | 'F54' | 'F55';

export interface P3PrerequisiteRegistryEntry {
  id: P3CapabilityId;
  title: string;
  requiredPrerequisites: string[];
  isFounderAuthorized: boolean;
  status: 'BLOCKED_PENDING_PREREQUISITES' | 'STAGED_AWAITING_APPROVAL' | 'CONDITIONALLY_ACTIVE';
}

export const P3_CAPABILITY_REGISTRY: Record<P3CapabilityId, P3PrerequisiteRegistryEntry> = {
  F49: {
    id: 'F49',
    title: 'AI travel copilot',
    requiredPrerequisites: [
      'Grounded tool evaluation suite proving hallucination rate <= 0.1%',
      'Deterministic fallback for all fare calculations',
      'Explicit founder authorization',
    ],
    isFounderAuthorized: false,
    status: 'BLOCKED_PENDING_PREREQUISITES',
  },
  F50: {
    id: 'F50',
    title: 'Historical fare forecasting',
    requiredPrerequisites: [
      'Rolling-horizon backtesting against >= 14 days historical data',
      'Uncertainty and non-guarantee disclosures in Vietnamese',
    ],
    isFounderAuthorized: true, // Implemented under bounded indicative mode
    status: 'CONDITIONALLY_ACTIVE',
  },
  F51: {
    id: 'F51',
    title: 'Subscription/premium Watch',
    requiredPrerequisites: [
      'PCI-DSS compliant payment processor integration',
      'Automated recurring billing and 1-click cancellation service',
      'Explicit founder commercial authorization',
    ],
    isFounderAuthorized: false,
    status: 'BLOCKED_PENDING_PREREQUISITES',
  },
  F52: {
    id: 'F52',
    title: 'Full ticket checkout',
    requiredPrerequisites: [
      'Direct IATA / BSP ticketing agent license or OTA fulfillment partner agreement',
      'Real-time ticketing escrow and refund guarantee fund',
      'Explicit founder legal authorization',
    ],
    isFounderAuthorized: false,
    status: 'BLOCKED_PENDING_PREREQUISITES',
  },
  F53: {
    id: 'F53',
    title: 'B2B Fare Intelligence API',
    requiredPrerequisites: [
      'Airline provider redistribution and commercial syndication rights (F85)',
      'Enterprise API rate limiter, billing meter, and commercial SLA guarantee',
      'Explicit founder enterprise authorization',
    ],
    isFounderAuthorized: false,
    status: 'BLOCKED_PENDING_PREREQUISITES',
  },
  F54: {
    id: 'F54',
    title: 'Credit-card / promotion optimization',
    requiredPrerequisites: [
      'Verified promotion eligibility rules and merchant discount terms',
      'Expiration boundary validation',
    ],
    isFounderAuthorized: true, // Implemented with eligibility checks
    status: 'CONDITIONALLY_ACTIVE',
  },
  F55: {
    id: 'F55',
    title: 'International language and market expansion',
    requiredPrerequisites: [
      'Real-time FX conversion oracle with live bank exchange rates',
      'International provider rights and multi-currency billing support',
      'Explicit founder international launch authorization',
    ],
    isFounderAuthorized: false,
    status: 'BLOCKED_PENDING_PREREQUISITES',
  },
};

/**
 * Validates whether a P3 capability can be legally and technically transitioned to LIVE.
 * Throws UnauthorizedP3ActivationError if prerequisites or founder authorization are missing.
 */
export function assertP3ActivationSafety(
  capabilityId: P3CapabilityId,
  fulfilledPrerequisites: string[],
  founderAuthToken?: string
): void {
  const entry = P3_CAPABILITY_REGISTRY[capabilityId];
  if (!entry) {
    throw new UnauthorizedP3ActivationError(`Unknown P3 capability ID: ${capabilityId}`);
  }

  // Check all required prerequisites
  const missingPrereqs = entry.requiredPrerequisites.filter(
    (req) => !fulfilledPrerequisites.includes(req)
  );

  if (missingPrereqs.length > 0) {
    throw new UnauthorizedP3ActivationError(
      `Cannot activate ${entry.id} (${entry.title}): Missing required prerequisites: [${missingPrereqs.join('; ')}].`
    );
  }

  // Check founder authorization for high-risk commercial capabilities
  if (['F51', 'F52', 'F53', 'F55'].includes(capabilityId)) {
    if (!founderAuthToken || !founderAuthToken.startsWith('FOUNDER_AUTH_')) {
      throw new UnauthorizedP3ActivationError(
        `Cannot activate ${entry.id} (${entry.title}): High-risk commercial/legal capability strictly requires explicit Founder authorization token.`
      );
    }
  }
}
