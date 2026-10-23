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

import { sha256Hex } from './identity.ts';

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

export const FOUNDER_AUTH_SALT = 'farely:founder:p3:auth:v1';
export const DEFAULT_FOUNDER_KEY = 'farely-founder-genesis-auth-key';

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
    // AUD-01 & AUD-14: Invariant 1 - Do not hardcode isFounderAuthorized: true without authentic token
    isFounderAuthorized: false,
    status: 'STAGED_AWAITING_APPROVAL',
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
    // AUD-01 & AUD-14: Invariant 1 - Staged until authentic Founder activation token is applied
    isFounderAuthorized: false,
    status: 'STAGED_AWAITING_APPROVAL',
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
 * Generates an authentic cryptographically signed Founder authorization token.
 */
export function generateFounderAuthToken(params: {
  capabilityId: P3CapabilityId;
  expiresAtEpochMs: number;
  founderSecret?: string;
}): string {
  const secret = params.founderSecret || DEFAULT_FOUNDER_KEY;
  const payload = `${params.capabilityId}:${params.expiresAtEpochMs}:${secret}:${FOUNDER_AUTH_SALT}`;
  const sig = sha256Hex(payload).slice(0, 32);
  return `FOUNDER_AUTH_${params.capabilityId}_${params.expiresAtEpochMs}_${sig}`;
}

/**
 * Validates a Founder authorization token format, capability binding, expiry, and signature.
 */
export function verifyFounderAuthToken(params: {
  capabilityId: P3CapabilityId;
  token?: string;
  founderSecret?: string;
  nowEpochMs?: number;
}): { valid: boolean; reason?: string } {
  if (!params.token) {
    return { valid: false, reason: 'Mã xác thực Founder bị thiếu.' };
  }
  const parts = params.token.split('_');
  if (parts.length < 5 || parts[0] !== 'FOUNDER' || parts[1] !== 'AUTH') {
    return { valid: false, reason: 'Định dạng mã xác thực không hợp lệ. Yêu cầu FOUNDER_AUTH_<CAP>_<EXPIRY>_<SIG>.' };
  }
  const capId = parts[2] as P3CapabilityId;
  const expiryStr = parts[3];
  const signature = parts.slice(4).join('_');

  if (capId !== params.capabilityId) {
    return { valid: false, reason: `Mã xác thực không khớp năng lực (yêu cầu ${params.capabilityId}, nhận ${capId}).` };
  }

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry)) {
    return { valid: false, reason: 'Thời điểm hết hạn của mã xác thực không hợp lệ.' };
  }

  const now = params.nowEpochMs ?? Date.now();
  if (now > expiry) {
    return { valid: false, reason: `Mã xác thực Founder đã hết hạn (hạn: ${expiry}, hiện tại: ${now}).` };
  }

  // EV34-11 & AUD-V34-09: Reject tokens signed using repository-known secret (DEFAULT_FOUNDER_KEY)
  const defaultPayload = `${capId}:${expiry}:${DEFAULT_FOUNDER_KEY}:${FOUNDER_AUTH_SALT}`;
  const defaultSig = sha256Hex(defaultPayload).slice(0, 32);
  if (signature === defaultSig) {
    return {
      valid: false,
      reason: 'Từ chối kích hoạt P3: Token được ký bằng khóa mặc định công khai trong mã nguồn (repository-known DEFAULT_FOUNDER_KEY). Yêu cầu bí mật server-side thực tế.',
    };
  }

  const secret = params.founderSecret || (typeof process !== 'undefined' ? process.env?.FOUNDER_ACTIVATION_SECRET : undefined);
  if (!secret || secret === DEFAULT_FOUNDER_KEY || secret === 'farely-founder-genesis-auth-key') {
    return {
      valid: false,
      reason: 'Bí mật xác thực Founder chưa được cấu hình hoặc sử dụng khóa mặc định công khai.',
    };
  }

  const expectedPayload = `${capId}:${expiry}:${secret}:${FOUNDER_AUTH_SALT}`;
  const expectedSig = sha256Hex(expectedPayload).slice(0, 32);

  if (signature !== expectedSig) {
    return { valid: false, reason: 'Chữ ký mật mã không khớp. Mã xác thực không chính thức hoặc đã bị giả mạo.' };
  }

  return { valid: true };
}

/**
 * Validates whether a P3 capability can be legally and technically transitioned to LIVE.
 * Throws UnauthorizedP3ActivationError if prerequisites or founder authorization are missing.
 */
export function assertP3ActivationSafety(
  capabilityId: P3CapabilityId,
  fulfilledPrerequisites: string[],
  founderAuthToken?: string,
  options?: {
    founderSecret?: string;
    nowEpochMs?: number;
  }
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
  if (['F49', 'F51', 'F52', 'F53', 'F55'].includes(capabilityId)) {
    const authResult = verifyFounderAuthToken({
      capabilityId,
      token: founderAuthToken,
      founderSecret: options?.founderSecret,
      nowEpochMs: options?.nowEpochMs,
    });

    if (!authResult.valid) {
      throw new UnauthorizedP3ActivationError(
        `Cannot activate ${entry.id} (${entry.title}): High-risk commercial/legal capability strictly requires verified Founder authorization token. ${authResult.reason}`
      );
    }
  } else if (founderAuthToken) {
    // If a token is provided for F49/F50/F54, it must also be cryptographically authentic
    const authResult = verifyFounderAuthToken({
      capabilityId,
      token: founderAuthToken,
      founderSecret: options?.founderSecret,
      nowEpochMs: options?.nowEpochMs,
    });
    if (!authResult.valid) {
      throw new UnauthorizedP3ActivationError(
        `Cannot activate ${entry.id} (${entry.title}): Invalid Founder authorization token. ${authResult.reason}`
      );
    }
  }
}
