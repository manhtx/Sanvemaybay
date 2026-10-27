import { describe, expect, it } from 'vitest';
import {
  assertP3ActivationSafety,
  UnauthorizedP3ActivationError,
  P3_CAPABILITY_REGISTRY,
  generateFounderAuthToken,
  timingSafeEqualHex,
  verifyFounderAuthorization,
  FOUNDER_AUTH_SALT,
} from './conditionalGrowthSafety';
import { sha256Hex } from './identity';

describe('Rule 4 & Section D4: Conditional Growth Safety & P3 Governance', () => {
  it('allows activation of F50 (forecasting) when bounded prerequisites are satisfied', () => {
    expect(() =>
      assertP3ActivationSafety('F50', [
        'Rolling-horizon backtesting against >= 14 days historical data',
        'Uncertainty and non-guarantee disclosures in Vietnamese',
      ])
    ).not.toThrow();
  });

  it('allows activation of F54 (promotions) when eligibility rules are satisfied', () => {
    expect(() =>
      assertP3ActivationSafety('F54', [
        'Verified promotion eligibility rules and merchant discount terms',
        'Expiration boundary validation',
      ])
    ).not.toThrow();
  });

  it('throws UnauthorizedP3ActivationError if F52 (Full checkout) lacks ticketing license', () => {
    expect(() =>
      assertP3ActivationSafety('F52', [
        'Real-time ticketing escrow and refund guarantee fund',
        // Missing IATA / BSP ticketing agent license!
      ], 'FOUNDER_AUTH_12345')
    ).toThrow(UnauthorizedP3ActivationError);
  });

  it('throws UnauthorizedP3ActivationError if F52 (Full checkout) has prerequisites but lacks Founder token', () => {
    expect(() =>
      assertP3ActivationSafety('F52', [
        'Direct IATA / BSP ticketing agent license or OTA fulfillment partner agreement',
        'Real-time ticketing escrow and refund guarantee fund',
        'Explicit founder legal authorization',
      ] /* Missing founderAuthToken */)
    ).toThrow(UnauthorizedP3ActivationError);
  });

  it('throws UnauthorizedP3ActivationError if F53 (B2B API) lacks provider redistribution rights', () => {
    expect(() =>
      assertP3ActivationSafety('F53', [
        'Enterprise API rate limiter, billing meter, and commercial SLA guarantee',
        'Explicit founder enterprise authorization',
      ], 'FOUNDER_AUTH_ENTERPRISE')
    ).toThrow(UnauthorizedP3ActivationError);
  });

  it('registry correctly classifies high-risk commercial P3 features as blocked pending prerequisites, and F50/F54 staged without self-authorization (AUD-01, AUD-14)', () => {
    expect(P3_CAPABILITY_REGISTRY.F51.status).toBe('BLOCKED_PENDING_PREREQUISITES');
    expect(P3_CAPABILITY_REGISTRY.F52.status).toBe('BLOCKED_PENDING_PREREQUISITES');
    expect(P3_CAPABILITY_REGISTRY.F53.status).toBe('BLOCKED_PENDING_PREREQUISITES');
    expect(P3_CAPABILITY_REGISTRY.F55.status).toBe('BLOCKED_PENDING_PREREQUISITES');

    // AUD-01 & AUD-14: Invariant 1 - Do not hardcode isFounderAuthorized: true
    expect(P3_CAPABILITY_REGISTRY.F50.isFounderAuthorized).toBe(false);
    expect(P3_CAPABILITY_REGISTRY.F50.status).toBe('STAGED_AWAITING_APPROVAL');
    expect(P3_CAPABILITY_REGISTRY.F54.isFounderAuthorized).toBe(false);
    expect(P3_CAPABILITY_REGISTRY.F54.status).toBe('STAGED_AWAITING_APPROVAL');
  });

  it('authenticates valid cryptographic Founder authorization token with secure secret and rejects repository-known/forged/expired tokens (AUD-01, AUD-V34-09, EV34-11)', () => {
    const futureExpiry = Date.now() + 1000 * 60 * 60; // 1 hour ahead
    const secureSecret = 'secure-founder-auth-secret-epoch-2026';
    const validToken = generateFounderAuthToken({
      capabilityId: 'F52',
      expiresAtEpochMs: futureExpiry,
      founderSecret: secureSecret,
    });

    // Valid token with authentic secret allows activation when all prerequisites are fulfilled
    expect(() =>
      assertP3ActivationSafety(
        'F52',
        [
          'Direct IATA / BSP ticketing agent license or OTA fulfillment partner agreement',
          'Real-time ticketing escrow and refund guarantee fund',
          'Explicit founder legal authorization',
        ],
        validToken,
        { founderSecret: secureSecret }
      )
    ).not.toThrow();

    // EV34-11: Token signed with repository-known DEFAULT_FOUNDER_KEY is strictly rejected
    const defaultKeyToken = generateFounderAuthToken({
      capabilityId: 'F52',
      expiresAtEpochMs: futureExpiry,
      // Uses DEFAULT_FOUNDER_KEY
    });
    expect(() =>
      assertP3ActivationSafety(
        'F52',
        [
          'Direct IATA / BSP ticketing agent license or OTA fulfillment partner agreement',
          'Real-time ticketing escrow and refund guarantee fund',
          'Explicit founder legal authorization',
        ],
        defaultKeyToken,
        { founderSecret: secureSecret }
      )
    ).toThrow(UnauthorizedP3ActivationError);

    // Forged token is rejected with cryptographic signature mismatch
    const forgedToken = `FOUNDER_AUTH_F52_${futureExpiry}_deadbeefcafebabe0000000000000000`;
    expect(() =>
      assertP3ActivationSafety(
        'F52',
        [
          'Direct IATA / BSP ticketing agent license or OTA fulfillment partner agreement',
          'Real-time ticketing escrow and refund guarantee fund',
          'Explicit founder legal authorization',
        ],
        forgedToken,
        { founderSecret: secureSecret }
      )
    ).toThrow(UnauthorizedP3ActivationError);

    // Expired token is rejected
    const pastExpiry = Date.now() - 1000 * 60; // 1 min ago
    const expiredToken = generateFounderAuthToken({
      capabilityId: 'F52',
      expiresAtEpochMs: pastExpiry,
      founderSecret: secureSecret,
    });
    expect(() =>
      assertP3ActivationSafety(
        'F52',
        [
          'Direct IATA / BSP ticketing agent license or OTA fulfillment partner agreement',
          'Real-time ticketing escrow and refund guarantee fund',
          'Explicit founder legal authorization',
        ],
        expiredToken,
        { founderSecret: secureSecret }
      )
    ).toThrow(UnauthorizedP3ActivationError);
  });

  describe('SOL-GROWTH-01: Cryptographic Founder Key Verification & Timing Safety', () => {
    it('timingSafeEqualHex executes constant-time equality over hex strings case-insensitively', () => {
      const hexA = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
      const hexB = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789';
      const hexC = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456780';

      expect(timingSafeEqualHex(hexA, hexB)).toBe(true);
      expect(timingSafeEqualHex(hexA, hexC)).toBe(false);
      expect(timingSafeEqualHex(hexA, 'short')).toBe(false);
      expect(timingSafeEqualHex(null as unknown as string, hexA)).toBe(false);
    });

    it('verifyFounderAuthorization enforces >= 12 chars entropy and matches salted hash', () => {
      const validKey = 'production-founder-key-2026';
      const expectedHash = sha256Hex(FOUNDER_AUTH_SALT + ':' + validKey);

      expect(verifyFounderAuthorization(validKey, expectedHash)).toBe(true);

      // Rejects short key (<12 chars)
      expect(verifyFounderAuthorization('short-key', expectedHash)).toBe(false);

      // Rejects empty/null/undefined
      expect(verifyFounderAuthorization('', expectedHash)).toBe(false);
      expect(verifyFounderAuthorization(null as unknown as string, expectedHash)).toBe(false);

      // Rejects incorrect key
      expect(verifyFounderAuthorization('wrong-production-key-2026', expectedHash)).toBe(false);

      // Strips non-printable ASCII control characters
      const keyWithControlChars = '\x00\x1F' + validKey + '\x7F';
      expect(verifyFounderAuthorization(keyWithControlChars, expectedHash)).toBe(true);
    });
  });
});
