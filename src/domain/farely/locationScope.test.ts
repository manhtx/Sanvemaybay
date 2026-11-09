/**
 * Unit Test Suite for Location Scope Resolution
 * REQ-DOM-004, REQ-DOM-005, NC-002, NC-003, FLY-INTEL-001
 */

import { describe, it, expect } from 'vitest';
import {
  resolveLocationScope,
  satisfiesLocationScope,
  METRO_CATALOG,
  AIRPORT_CATALOG
} from './locationScope';

describe('Location Scope Resolution & Invariant Verification (REQ-DOM-004, REQ-DOM-005, NC-002, NC-003)', () => {
  describe('Exact Airport Resolution', () => {
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
      expect(satisfiesLocationScope('SGN', scope)).toBe(true);
    });
  });

  describe('Metropolitan Resolution & Legacy Normalization', () => {
    it('resolves explicit METRO requestedType for airports with metroId', () => {
      const scope = resolveLocationScope('BKK', 'METRO');
      expect(scope.type).toBe('METRO');
      expect(scope.primaryCode).toBe('BKK_METRO');
      expect(scope.expandedCodes).toContain('BKK');
      expect(scope.expandedCodes).toContain('DMK');
    });

    it('resolves legacy _ALL suffix to canonical _METRO scope', () => {
      const bkkScope = resolveLocationScope('BKK_ALL');
      expect(bkkScope.type).toBe('METRO');
      expect(bkkScope.primaryCode).toBe('BKK_METRO');
      expect(bkkScope.expandedCodes).toEqual(['BKK', 'DMK']);

      const tyoScope = resolveLocationScope('TYO_ALL');
      expect(tyoScope.type).toBe('METRO');
      expect(tyoScope.primaryCode).toBe('TYO_METRO');
      expect(tyoScope.expandedCodes).toEqual(['HND', 'NRT']);

      const lonScope = resolveLocationScope('LON_ALL');
      expect(lonScope.type).toBe('METRO');
      expect(lonScope.primaryCode).toBe('LON_METRO');
      expect(lonScope.expandedCodes).toEqual(['LHR', 'LGW', 'STN', 'LTN']);
    });

    it('resolves canonical METRO query strings for Asian and global hubs', () => {
      const tyo = resolveLocationScope('TYO_METRO');
      expect(tyo.type).toBe('METRO');
      expect(tyo.expandedCodes).toEqual(['HND', 'NRT']);

      const sel = resolveLocationScope('SEL_METRO');
      expect(sel.type).toBe('METRO');
      expect(sel.expandedCodes).toEqual(['ICN', 'GMP']);

      const osa = resolveLocationScope('OSA_METRO');
      expect(osa.type).toBe('METRO');
      expect(osa.expandedCodes).toEqual(['KIX', 'ITM']);

      const tpe = resolveLocationScope('TPE_METRO');
      expect(tpe.type).toBe('METRO');
      expect(tpe.expandedCodes).toEqual(['TPE', 'TSA']);

      const nyc = resolveLocationScope('NYC_METRO');
      expect(nyc.type).toBe('METRO');
      expect(nyc.expandedCodes).toEqual(['JFK', 'EWR', 'LGA']);

      const par = resolveLocationScope('PAR_METRO');
      expect(par.type).toBe('METRO');
      expect(par.expandedCodes).toEqual(['CDG', 'ORY']);
    });
  });

  describe('NC-002 Sister Airport Isolation Invariant', () => {
    it('Bangkok: DMK satisfies Bangkok Metro, but DMK CANNOT satisfy exact BKK', () => {
      const exactBkkScope = resolveLocationScope('BKK', 'EXACT_AIRPORT');
      const metroBkkScope = resolveLocationScope('BKK_METRO');

      // Metro satisfies both BKK and DMK
      expect(satisfiesLocationScope('BKK', metroBkkScope)).toBe(true);
      expect(satisfiesLocationScope('DMK', metroBkkScope)).toBe(true);

      // Exact BKK strictly rejects DMK (Falsifier Assertion)
      expect(satisfiesLocationScope('BKK', exactBkkScope)).toBe(true);
      expect(satisfiesLocationScope('DMK', exactBkkScope)).toBe(false);
    });

    it('Tokyo: NRT satisfies Tokyo Metro, but NRT cannot satisfy exact HND', () => {
      const exactHndScope = resolveLocationScope('HND', 'EXACT_AIRPORT');
      const metroTyoScope = resolveLocationScope('TYO_METRO');

      expect(satisfiesLocationScope('HND', metroTyoScope)).toBe(true);
      expect(satisfiesLocationScope('NRT', metroTyoScope)).toBe(true);
      expect(satisfiesLocationScope('NRT', exactHndScope)).toBe(false);
      expect(satisfiesLocationScope('HND', exactHndScope)).toBe(true);
    });

    it('Seoul: GMP satisfies Seoul Metro, but GMP cannot satisfy exact ICN', () => {
      const exactIcn = resolveLocationScope('ICN', 'EXACT_AIRPORT');
      const metroSel = resolveLocationScope('SEL_METRO');

      expect(satisfiesLocationScope('ICN', metroSel)).toBe(true);
      expect(satisfiesLocationScope('GMP', metroSel)).toBe(true);
      expect(satisfiesLocationScope('GMP', exactIcn)).toBe(false);
    });

    it('New York: EWR and LGA satisfy NYC Metro, but neither satisfies exact JFK', () => {
      const exactJfk = resolveLocationScope('JFK', 'EXACT_AIRPORT');
      const metroNyc = resolveLocationScope('NYC_METRO');

      expect(satisfiesLocationScope('JFK', metroNyc)).toBe(true);
      expect(satisfiesLocationScope('EWR', metroNyc)).toBe(true);
      expect(satisfiesLocationScope('LGA', metroNyc)).toBe(true);

      expect(satisfiesLocationScope('EWR', exactJfk)).toBe(false);
      expect(satisfiesLocationScope('LGA', exactJfk)).toBe(false);
    });

    it('London: LGW, STN, LTN satisfy London Metro, but none satisfy exact LHR', () => {
      const exactLhr = resolveLocationScope('LHR', 'EXACT_AIRPORT');
      const metroLon = resolveLocationScope('LON_METRO');

      expect(satisfiesLocationScope('LHR', metroLon)).toBe(true);
      expect(satisfiesLocationScope('LGW', metroLon)).toBe(true);
      expect(satisfiesLocationScope('STN', metroLon)).toBe(true);
      expect(satisfiesLocationScope('LTN', metroLon)).toBe(true);

      expect(satisfiesLocationScope('LGW', exactLhr)).toBe(false);
      expect(satisfiesLocationScope('STN', exactLhr)).toBe(false);
      expect(satisfiesLocationScope('LTN', exactLhr)).toBe(false);
    });

    it('Paris: ORY satisfies Paris Metro, but ORY cannot satisfy exact CDG', () => {
      const exactCdg = resolveLocationScope('CDG', 'EXACT_AIRPORT');
      const metroPar = resolveLocationScope('PAR_METRO');

      expect(satisfiesLocationScope('CDG', metroPar)).toBe(true);
      expect(satisfiesLocationScope('ORY', metroPar)).toBe(true);
      expect(satisfiesLocationScope('ORY', exactCdg)).toBe(false);
    });
  });

  describe('Uncataloged Fallback & Catalog Integrity', () => {
    it('gracefully handles uncataloged airport codes with fallback to EXACT_AIRPORT', () => {
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
      expect(AIRPORT_CATALOG.SGN.country).toBe('VN');
      expect(AIRPORT_CATALOG.DAD.country).toBe('VN');
      expect(AIRPORT_CATALOG.BKK.country).toBe('TH');
      expect(AIRPORT_CATALOG.NRT.country).toBe('JP');
      expect(AIRPORT_CATALOG.ICN.country).toBe('KR');
      expect(AIRPORT_CATALOG.SIN.country).toBe('SG');
    });

    it('preserves airport timezone metadata without corruption', () => {
      expect(AIRPORT_CATALOG.HAN.timezone).toBe('Asia/Ho_Chi_Minh');
      expect(AIRPORT_CATALOG.BKK.timezone).toBe('Asia/Bangkok');
      expect(AIRPORT_CATALOG.NRT.timezone).toBe('Asia/Tokyo');
      expect(AIRPORT_CATALOG.SIN.timezone).toBe('Asia/Singapore');
    });
  });

  describe('High-Volume Performance & Pure Immutability', () => {
    it('executes 10,000 location scope resolutions in sub-50ms', () => {
      const queries = ['HAN', 'SGN', 'BKK_METRO', 'TYO_ALL', 'XYZ', 'ICN', 'LON_METRO'];
      const start = performance.now();
      let matches = 0;
      for (let i = 0; i < 10000; i++) {
        const q = queries[i % queries.length];
        const scope = resolveLocationScope(q);
        if (satisfiesLocationScope('HAN', scope)) matches++;
      }
      const elapsed = performance.now() - start;

      expect(matches).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate external objects or catalog definitions', () => {
      const bkkMetroBefore = [...METRO_CATALOG.BKK_METRO.airports];
      const scope = resolveLocationScope('BKK_METRO');
      scope.expandedCodes.push('FAKE_AIRPORT'); // Mutating returned scope should not affect catalog

      expect(METRO_CATALOG.BKK_METRO.airports).toEqual(bkkMetroBefore);
      expect(METRO_CATALOG.BKK_METRO.airports).not.toContain('FAKE_AIRPORT');
    });

    it('handles whitespace-padded, mixed-case, and uncataloged queries with safe EXACT_AIRPORT fallback', () => {
      const scope = resolveLocationScope('   abc   ');
      expect(scope.type).toBe('EXACT_AIRPORT');
      expect(scope.primaryCode).toBe('ABC');
      expect(scope.expandedCodes).toEqual(['ABC']);
      expect(satisfiesLocationScope('abc', scope)).toBe(true);
    });

    it('satisfiesLocationScope returns false for empty string, blank whitespace, or mismatched airport codes', () => {
      const hanScope = resolveLocationScope('HAN');
      expect(satisfiesLocationScope('', hanScope)).toBe(false);
      expect(satisfiesLocationScope('   ', hanScope)).toBe(false);
      expect(satisfiesLocationScope('SGN', hanScope)).toBe(false);
      expect(satisfiesLocationScope('XYZ', hanScope)).toBe(false);

      const metroScope = resolveLocationScope('BKK_METRO');
      expect(satisfiesLocationScope('', metroScope)).toBe(false);
      expect(satisfiesLocationScope('   ', metroScope)).toBe(false);
      expect(satisfiesLocationScope('HAN', metroScope)).toBe(false);
    });

    it('satisfiesLocationScope handles case-insensitive airport matching across both exact airport and metro scopes', () => {
      const exactScope = resolveLocationScope('HAN');
      expect(satisfiesLocationScope('han', exactScope)).toBe(true);
      expect(satisfiesLocationScope('Han', exactScope)).toBe(true);
      expect(satisfiesLocationScope(' HAN ', exactScope)).toBe(true);

      const metroScope = resolveLocationScope('TYO_METRO');
      expect(satisfiesLocationScope('hnd', metroScope)).toBe(true);
      expect(satisfiesLocationScope('Nrt', metroScope)).toBe(true);
      expect(satisfiesLocationScope(' nrt ', metroScope)).toBe(true);
      expect(satisfiesLocationScope('kix', metroScope)).toBe(false);
    });

    it('processes 50,000 satisfiesLocationScope evaluations within sub-50ms latency budget', () => {
      const exactScope = resolveLocationScope('HAN');
      const metroScope = resolveLocationScope('BKK_METRO');

      const start = performance.now();
      let count = 0;
      for (let i = 0; i < 25000; i++) {
        if (satisfiesLocationScope('HAN', exactScope)) count++;
        if (satisfiesLocationScope('DMK', metroScope)) count++;
      }
      const duration = performance.now() - start;

      expect(count).toBe(50000);
      expect(duration).toBeLessThan(50);
    });
  });
});
