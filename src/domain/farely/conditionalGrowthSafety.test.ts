import { describe, expect, it } from 'vitest';
import {
  assertP3ActivationSafety,
  UnauthorizedP3ActivationError,
  P3_CAPABILITY_REGISTRY,
} from './conditionalGrowthSafety';

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

  it('registry correctly classifies high-risk commercial P3 features as blocked pending prerequisites', () => {
    expect(P3_CAPABILITY_REGISTRY.F51.status).toBe('BLOCKED_PENDING_PREREQUISITES');
    expect(P3_CAPABILITY_REGISTRY.F52.status).toBe('BLOCKED_PENDING_PREREQUISITES');
    expect(P3_CAPABILITY_REGISTRY.F53.status).toBe('BLOCKED_PENDING_PREREQUISITES');
    expect(P3_CAPABILITY_REGISTRY.F55.status).toBe('BLOCKED_PENDING_PREREQUISITES');
  });
});
