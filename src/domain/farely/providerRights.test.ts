import { describe, it, expect } from 'vitest';
import {
  PROVIDER_SOURCE_RIGHTS_REGISTRY,
  getProviderSourceRights,
  hasB2BRedistributionRights,
  validateB2BRedistributionScope,
  filterRecordsForB2BExport,
  DataRightsViolationError,
  isCommercialContractRequired,
} from './providerRights.ts';

describe('Provider Source Rights Registry (F85)', () => {
  it('registers rights metadata for all canonical sources', () => {
    expect(PROVIDER_SOURCE_RIGHTS_REGISTRY.vietjet_direct).toBeDefined();
    expect(PROVIDER_SOURCE_RIGHTS_REGISTRY.vietnam_airlines).toBeDefined();
    expect(PROVIDER_SOURCE_RIGHTS_REGISTRY.fast_flights_google).toBeDefined();
    expect(PROVIDER_SOURCE_RIGHTS_REGISTRY.amadeus_commercial_gds).toBeDefined();

    const vj = getProviderSourceRights('vietjet_direct');
    expect(vj?.canDisplayDirectly).toBe(true);
    expect(vj?.canCache).toBe(true);
    expect(vj?.cacheTtlSeconds).toBe(1800);
    expect(vj?.attributionRequired).toBe(true);
  });

  it('differentiates public indicative sources from commercial direct feeds', () => {
    const google = getProviderSourceRights('fast_flights_google');
    expect(google?.licenseType).toBe('PUBLIC_INDICATIVE');
    expect(google?.canRedistributeB2B).toBe(false);
    expect(google?.authorizedScopes).toContain('CONSUMER_INDICATIVE');
    expect(google?.authorizedScopes).not.toContain('B2B_SYNDICATION');

    const amadeus = getProviderSourceRights('amadeus_commercial_gds');
    expect(amadeus?.licenseType).toBe('COMMERCIAL_DIRECT');
    expect(amadeus?.canRedistributeB2B).toBe(true);
    expect(amadeus?.authorizedScopes).toContain('B2B_SYNDICATION');
  });

  it('validates B2B redistribution scope and identifies unauthorized sources', () => {
    const scopeCheck = validateB2BRedistributionScope([
      'amadeus_commercial_gds',
      'vietjet_direct',
      'fast_flights_google',
      'unregistered_random_bot',
    ]);

    expect(scopeCheck.authorized).toEqual(['amadeus_commercial_gds']);
    expect(scopeCheck.denied).toHaveLength(3);

    const vjDenial = scopeCheck.denied.find((d) => d.providerId === 'vietjet_direct');
    expect(vjDenial?.reason).toContain('Không có quyền B2B syndication');

    const unregDenial = scopeCheck.denied.find((d) => d.providerId === 'unregistered_random_bot');
    expect(unregDenial?.reason).toContain('chưa được đăng ký');
  });

  describe('STRICT ACCEPTANCE (F85): No premium/B2B redistribution without actual rights', () => {
    const mixedRecords = [
      { id: 'rec-1', providerId: 'amadeus_commercial_gds', flightNo: 'VN123', price: 2500000 },
      { id: 'rec-2', providerId: 'vietjet_direct', flightNo: 'VJ456', price: 1800000 },
      { id: 'rec-3', providerId: 'sabre_enterprise_feed', flightNo: 'QH789', price: 2200000 },
      { id: 'rec-4', providerId: 'fast_flights_google', flightNo: 'TG550', price: 3100000 },
    ];

    it('safely filters out non-B2B eligible records from syndication export', () => {
      const outcome = filterRecordsForB2BExport(mixedRecords);

      expect(outcome.permittedRecords).toHaveLength(2);
      expect(outcome.permittedRecords.map((r) => r.id)).toEqual(['rec-1', 'rec-3']);

      expect(outcome.rejectedRecords).toHaveLength(2);
      expect(outcome.rejectedRecords.map((r) => r.id)).toEqual(['rec-2', 'rec-4']);

      expect(outcome.rejectedReasons).toHaveLength(2);
      expect(outcome.rejectedReasons[0].providerId).toBe('vietjet_direct');
      expect(outcome.rejectedReasons[1].providerId).toBe('fast_flights_google');
    });

    it('throws DataRightsViolationError in strict mode when unauthorized records are supplied', () => {
      expect(() => {
        filterRecordsForB2BExport(mixedRecords, { strict: true });
      }).toThrowError(DataRightsViolationError);

      try {
        filterRecordsForB2BExport(mixedRecords, { strict: true });
      } catch (err: any) {
        expect(err.name).toBe('DataRightsViolationError');
        expect(err.providerId).toBe('vietjet_direct');
        expect(err.message).toContain('F85 DataRightsViolation');
      }
    });

    it('permits clean export when 100% of providers hold commercial B2B rights', () => {
      const licensedRecords = [
        { id: 'rec-1', providerId: 'amadeus_commercial_gds', price: 2500000 },
        { id: 'rec-3', providerId: 'sabre_enterprise_feed', price: 2200000 },
      ];

      const outcome = filterRecordsForB2BExport(licensedRecords, { strict: true });
      expect(outcome.permittedRecords).toHaveLength(2);
      expect(outcome.rejectedRecords).toHaveLength(0);
    });
  });

  describe('Epistemic & Boundary Audit (AUD-08)', () => {
    it('flags public indicative providers as internal declarations', () => {
      const google = getProviderSourceRights('fast_flights_google');
      expect(google?.declarationStatus).toBe('INTERNAL_DECLARATION');

      const vj = getProviderSourceRights('vietjet_direct');
      expect(vj?.declarationStatus).toBe('INTERNAL_DECLARATION');
      expect(isCommercialContractRequired('vietjet_direct')).toBe(false);
    });

    it('flags commercial GDS feeds as staged pending executed contracts (BLK-PROV-01)', () => {
      const amadeus = getProviderSourceRights('amadeus_commercial_gds');
      expect(amadeus?.declarationStatus).toBe('COMMERCIAL_STAGED_CONTRACT_REQUIRED');
      expect(amadeus?.termsSummary).toContain('BLK-PROV-01');
      expect(isCommercialContractRequired('amadeus_commercial_gds')).toBe(true);

      const sabre = getProviderSourceRights('sabre_enterprise_feed');
      expect(sabre?.declarationStatus).toBe('COMMERCIAL_STAGED_CONTRACT_REQUIRED');
      expect(isCommercialContractRequired('sabre_enterprise_feed')).toBe(true);
    });
  });
});
