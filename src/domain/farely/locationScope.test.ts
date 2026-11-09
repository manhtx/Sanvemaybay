/**
 * Unit Test Suite for Location Scope Resolution
 * REQ-DOM-004, REQ-DOM-005, NC-002, NC-003
 */

import { describe, it, expect } from 'vitest';
import {
  resolveLocationScope,
  satisfiesLocationScope,
  METRO_CATALOG,
  AIRPORT_CATALOG
} from './locationScope';

describe('Location Scope Resolution & Invariant Verification', () => {
  it('resolves exact airport codes correctly', () => {
    const scope = resolveLocationScope('HAN');
    expect(scope.type).toBe('EXACT_AIRPORT');
    expect(scope.primaryCode).toBe('HAN');
    expect(scope.expandedCodes).toEqual(['HAN']);
    expect(satisfiesLocationScope('HAN', scope)).toBe(true);
    expect(satisfiesLocationScope('SGN', scope)).toBe(false);
  });

  it('handles case insensitivity and whitespace trimming', () => {
    const scope = resolveLocationScope('  sgn  ');
    expect(scope.type).toBe('EXACT_AIRPORT');
    expect(scope.primaryCode).toBe('SGN');
    expect(satisfiesLocationScope('sgn', scope)).toBe(true);
  });

  it('resolves explicit METRO requestedType for airports with metroId', () => {
    const scope = resolveLocationScope('BKK', 'METRO');
    expect(scope.type).toBe('METRO');
    expect(scope.primaryCode).toBe('BKK_METRO');
    expect(scope.expandedCodes).toContain('BKK');
    expect(scope.expandedCodes).toContain('DMK');
  });

  it('resolves legacy _ALL suffix to canonical _METRO scope', () => {
    const scope = resolveLocationScope('BKK_ALL');
    expect(scope.type).toBe('METRO');
    expect(scope.primaryCode).toBe('BKK_METRO');
    expect(scope.expandedCodes).toEqual(['BKK', 'DMK']);
  });

  it('resolves TYO_METRO and SEL_METRO with correct airport lists', () => {
    const tyoScope = resolveLocationScope('TYO_METRO');
    expect(tyoScope.type).toBe('METRO');
    expect(tyoScope.expandedCodes).toEqual(['HND', 'NRT']);

    const selScope = resolveLocationScope('SEL_METRO');
    expect(selScope.type).toBe('METRO');
    expect(selScope.expandedCodes).toEqual(['ICN', 'GMP']);
  });

  it('satisfies invariant NC-002: DMK satisfies Bangkok Metro, but DMK CANNOT satisfy exact BKK', () => {
    const exactBkkScope = resolveLocationScope('BKK', 'EXACT_AIRPORT');
    const metroBkkScope = resolveLocationScope('BKK_METRO');

    // Metro satisfies both BKK and DMK
    expect(satisfiesLocationScope('BKK', metroBkkScope)).toBe(true);
    expect(satisfiesLocationScope('DMK', metroBkkScope)).toBe(true);

    // Exact BKK strictly rejects DMK (Falsifier Assertion)
    expect(satisfiesLocationScope('BKK', exactBkkScope)).toBe(true);
    expect(satisfiesLocationScope('DMK', exactBkkScope)).toBe(false);
  });

  it('satisfies invariant NC-002: HND satisfies Tokyo Metro, but NRT cannot satisfy exact HND', () => {
    const exactHndScope = resolveLocationScope('HND', 'EXACT_AIRPORT');
    const metroTyoScope = resolveLocationScope('TYO_METRO');

    expect(satisfiesLocationScope('HND', metroTyoScope)).toBe(true);
    expect(satisfiesLocationScope('NRT', metroTyoScope)).toBe(true);
    expect(satisfiesLocationScope('NRT', exactHndScope)).toBe(false);
  });

  it('gracefully handles uncataloged airport codes with fallback', () => {
    const unknownScope = resolveLocationScope('XYZ');
    expect(unknownScope.type).toBe('EXACT_AIRPORT');
    expect(unknownScope.primaryCode).toBe('XYZ');
    expect(unknownScope.expandedCodes).toEqual(['XYZ']);
    expect(satisfiesLocationScope('XYZ', unknownScope)).toBe(true);
    expect(satisfiesLocationScope('HAN', unknownScope)).toBe(false);
  });

  it('verifies catalog completeness for all defined metros and airports', () => {
    expect(Object.keys(METRO_CATALOG).length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(AIRPORT_CATALOG).length).toBeGreaterThanOrEqual(25);
    expect(AIRPORT_CATALOG.HAN.country).toBe('VN');
    expect(AIRPORT_CATALOG.BKK.country).toBe('TH');
  });
});
