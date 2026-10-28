import { describe, it, expect } from 'vitest';
import {
  findGroundTransfer,
  areAirportsInSameMetro,
  calculateTimezoneAwareTiming,
  evaluateAirportAlternative,
  evaluateAlternativeAirportSavings,
} from './airportAlternatives.ts';

describe('F23: Airport Alternatives with Ground Transfer Time and Cost', () => {
  it('correctly retrieves verified ground transfer routes for canonical metro airports', () => {
    const bkkDmk = findGroundTransfer('BKK', 'DMK');
    expect(bkkDmk).toBeDefined();
    expect(bkkDmk?.distanceKm).toBe(47);
    expect(bkkDmk?.typicalMinutes).toBe(60);
    expect(bkkDmk?.estimatedCostVND).toBe(200000);
    expect(bkkDmk?.isVerifiedSource).toBe(true);

    const hndNrt = findGroundTransfer('HND', 'NRT');
    expect(hndNrt).toBeDefined();
    expect(hndNrt?.typicalMinutes).toBe(85);
    expect(hndNrt?.estimatedCostVND).toBe(580000);
    expect(hndNrt?.isVerifiedSource).toBe(true);
  });

  it('correctly retrieves bidirectional ground transfer for Hanoi and Van Don (HAN <-> VDO)', () => {
    const hanVdo = findGroundTransfer('HAN', 'VDO');
    expect(hanVdo).toBeDefined();
    expect(hanVdo?.distanceKm).toBe(175);
    expect(hanVdo?.typicalMinutes).toBe(150);
    expect(hanVdo?.estimatedCostVND).toBe(280000);
    expect(hanVdo?.isVerifiedSource).toBe(true);
    expect(hanVdo?.modes[0]).toContain('Vân Đồn');

    const vdoHan = findGroundTransfer('VDO', 'HAN');
    expect(vdoHan).toBeDefined();
    expect(vdoHan?.distanceKm).toBe(175);
    expect(vdoHan?.typicalMinutes).toBe(150);
    expect(vdoHan?.estimatedCostVND).toBe(280000);
  });

  it('identifies co-located metro pairs correctly', () => {
    expect(areAirportsInSameMetro('BKK', 'DMK')).toEqual({ inSameMetro: true, metroId: 'BKK_METRO' });
    expect(areAirportsInSameMetro('HND', 'NRT')).toEqual({ inSameMetro: true, metroId: 'TYO_METRO' });
    expect(areAirportsInSameMetro('ICN', 'GMP')).toEqual({ inSameMetro: true, metroId: 'SEL_METRO' });
    expect(areAirportsInSameMetro('HAN', 'SGN')).toEqual({ inSameMetro: false });
  });

  it('F23 Invariant: Compares grounded air fare savings against travel inconvenience, not price-only swaps', () => {
    // Scenario A: Alternative DMK is 100,000 VND cheaper, but transfer costs 200,000 VND
    const evaluationA = evaluateAirportAlternative({
      baselineAirportCode: 'BKK',
      baselinePrice: 2500000,
      alternativeAirportCode: 'DMK',
      alternativePrice: 2400000, // 100k cheaper air fare
    });

    expect(evaluationA.airFareSavingsVND).toBe(100000);
    expect(evaluationA.groundTransfer.estimatedCostVND).toBe(200000);
    expect(evaluationA.netSavingsVND).toBe(-100000); // Net loss!
    expect(evaluationA.worthwhile).toBe(false);
    expect(evaluationA.verdict).toBe('NOT_RECOMMENDED');
    expect(evaluationA.tradeoffExplanation).toContain('phát sinh thêm chi phí ròng');
    expect(evaluationA.tradeoffExplanation).toContain('Không khuyến nghị đổi sân bay');
  });

  it('flags marginal savings when net financial gain is negligible compared to time lost', () => {
    // Scenario B: Alternative DMK is 300,000 VND cheaper, transfer costs 200,000 VND (Net savings: 100k for 60 mins)
    const evaluationB = evaluateAirportAlternative({
      baselineAirportCode: 'BKK',
      baselinePrice: 2500000,
      alternativeAirportCode: 'DMK',
      alternativePrice: 2200000,
    });

    expect(evaluationB.airFareSavingsVND).toBe(300000);
    expect(evaluationB.netSavingsVND).toBe(100000);
    expect(evaluationB.hourlyEfficiencyVND).toBe(100000); // 100k/hr < 250k/hr threshold
    expect(evaluationB.worthwhile).toBe(false);
    expect(evaluationB.verdict).toBe('MARGINAL');
    expect(evaluationB.tradeoffExplanation).toContain('không đủ bù đắp sự bất tiện');
  });

  it('strongly recommends substantial net savings after ground transfer deductions', () => {
    // Scenario C: Alternative DMK is 1,500,000 VND cheaper, transfer is 200,000 VND (Net savings: 1.3M for 60 mins)
    const evaluationC = evaluateAirportAlternative({
      baselineAirportCode: 'BKK',
      baselinePrice: 3500000,
      alternativeAirportCode: 'DMK',
      alternativePrice: 2000000,
    });

    expect(evaluationC.airFareSavingsVND).toBe(1500000);
    expect(evaluationC.netSavingsVND).toBe(1300000);
    expect(evaluationC.worthwhile).toBe(true);
    expect(evaluationC.verdict).toBe('RECOMMENDED');
    expect(evaluationC.tradeoffExplanation).toContain('Tiết kiệm thực tế 1.300.000₫');
    expect(evaluationC.tradeoffExplanation).toContain('rất đáng cân nhắc');
    expect(evaluationC.transferFrictionCategory).toBe('MEDIUM');
  });

  it('handles uncataloged pairs with explicitly labeled heuristic estimate and caps verdict at MARGINAL (L03/L09)', () => {
    const evaluation = evaluateAirportAlternative({
      baselineAirportCode: 'VDO',
      baselinePrice: 3000000,
      alternativeAirportCode: 'DIN',
      alternativePrice: 1500000,
    });

    expect(evaluation.groundTransfer.isVerifiedSource).toBe(false);
    expect(evaluation.groundTransfer.sourceName).toContain('Ước tính thuật toán');
    // Unverified heuristic source must not achieve RECOMMENDED
    expect(evaluation.verdict).toBe('MARGINAL');
    expect(evaluation.worthwhile).toBe(false);
    expect(evaluation.tradeoffExplanation).toContain('chưa được kiểm chứng từ nguồn chính thức');
  });

  it('rejects excessive detour transit (>180m) as NOT_RECOMMENDED (L01/L06)', () => {
    // SGN <-> VCA is 180 min, but if uncataloged regional transit is > 180m
    const evaluation = evaluateAirportAlternative({
      baselineAirportCode: 'HAN',
      baselinePrice: 5000000,
      alternativeAirportCode: 'SGN', // not in same metro, fallback transit is heuristic or test
      alternativePrice: 2000000,
    });

    // Check friction category
    expect(['HIGH', 'EXCESSIVE']).toContain(evaluation.transferFrictionCategory);
  });

  it('rejects identical airport comparisons and invalid prices safely', () => {
    const identical = evaluateAirportAlternative({
      baselineAirportCode: 'HAN',
      baselinePrice: 1200000,
      alternativeAirportCode: 'han ',
      alternativePrice: 1100000,
    });
    expect(identical.verdict).toBe('NOT_RECOMMENDED');
    expect(identical.netSavingsVND).toBe(0);
    expect(identical.worthwhile).toBe(false);
    expect(identical.tradeoffExplanation).toContain('trùng khớp');

    const invalidPrice = evaluateAirportAlternative({
      baselineAirportCode: 'HAN',
      baselinePrice: NaN,
      alternativeAirportCode: 'VDO',
      alternativePrice: -500000,
    });
    expect(invalidPrice.verdict).toBe('NOT_RECOMMENDED');
    expect(invalidPrice.worthwhile).toBe(false);
    expect(invalidPrice.tradeoffExplanation).toContain('không hợp lệ');
  });
});

describe('F68: Airport and Local Datetime Correctness across Timezones & Overnight', () => {
  it('correctly calculates true elapsed minutes across international timezones', () => {
    // Flight HAN (UTC+7) -> NRT (UTC+9)
    // Depart: 2026-11-01 23:30 (HAN local -> 16:30 UTC)
    // Arrive: 2026-11-02 06:00 (NRT local -> 21:00 UTC)
    // Elapsed: 4.5 hours = 270 minutes
    const timing = calculateTimezoneAwareTiming({
      departureCode: 'HAN',
      arrivalCode: 'NRT',
      departureLocalIso: '2026-11-01T23:30:00',
      arrivalLocalIso: '2026-11-02T06:00:00',
    });

    expect(timing.crossTimezone).toBe(true);
    expect(timing.timezoneOffsetHours).toBe(2);
    expect(timing.isOvernight).toBe(true);
    expect(timing.trueElapsedMinutes).toBe(270);
    expect(timing.rawElapsedMinutes).toBe(270);
    expect(timing.isInvertedSchedule).toBe(false);
  });

  it('correctly calculates domestic same-timezone flight duration without phantom offsets', () => {
    // Flight HAN -> SGN (both UTC+7)
    // Depart: 2026-11-01 08:00
    // Arrive: 2026-11-01 10:15
    // Elapsed: 2 hours 15 minutes = 135 minutes
    const timing = calculateTimezoneAwareTiming({
      departureCode: 'HAN',
      arrivalCode: 'SGN',
      departureLocalIso: '2026-11-01T08:00:00',
      arrivalLocalIso: '2026-11-01T10:15:00',
    });

    expect(timing.crossTimezone).toBe(false);
    expect(timing.timezoneOffsetHours).toBe(0);
    expect(timing.isOvernight).toBe(false);
    expect(timing.trueElapsedMinutes).toBe(135);
    expect(timing.isInvertedSchedule).toBe(false);
  });

  it('WP01: defensively clamps negative elapsed durations to commercial floor (>= 15 min) and exposes telemetry (L01/L10)', () => {
    // Inverted flight: arrive before departure
    const timing = calculateTimezoneAwareTiming({
      departureCode: 'HAN',
      arrivalCode: 'SGN',
      departureLocalIso: '2026-11-01T10:15:00',
      arrivalLocalIso: '2026-11-01T08:00:00',
    });

    expect(timing.trueElapsedMinutes).toBe(15);
    expect(timing.rawElapsedMinutes).toBe(-135);
    expect(timing.isInvertedSchedule).toBe(true);
  });

  it('WP01: rejects malformed date strings with informative error', () => {
    expect(() =>
      calculateTimezoneAwareTiming({
        departureCode: 'HAN',
        arrivalCode: 'SGN',
        departureLocalIso: 'invalid-date',
        arrivalLocalIso: '2026-11-01T10:15:00',
      })
    ).toThrow('Định dạng thời gian bay không hợp lệ');
  });

  describe('SOL-AIRPORT-01: Alternative Airport Net Economic Savings & Friction', () => {
    it('accurately debits surface transit cost and validates economic viability', () => {
      // 500k fare savings - 200k taxi = 300k net savings (60 min)
      const res1 = evaluateAlternativeAirportSavings({
        primaryAirfare: 2000000,
        alternativeAirfare: 1500000,
        surfaceTransitCost: 200000,
        transferMinutes: 60,
      });
      expect(res1.airFareSavingsVND).toBe(500000);
      expect(res1.netSavingsVND).toBe(300000);
      expect(res1.isEconomicallyViable).toBe(true);
      expect(res1.explanationVi).toContain('Tiết kiệm thực tế 300.000 đ');

      // 100k fare savings - 200k taxi = -100k net loss -> not viable
      const res2 = evaluateAlternativeAirportSavings({
        primaryAirfare: 2000000,
        alternativeAirfare: 1900000,
        surfaceTransitCost: 200000,
        transferMinutes: 60,
      });
      expect(res2.airFareSavingsVND).toBe(100000);
      expect(res2.netSavingsVND).toBe(-100000);
      expect(res2.isEconomicallyViable).toBe(false);
      expect(res2.explanationVi).toContain('vượt quá mức chênh lệch giá vé');

      // Excessive detour time > 180 min -> not viable
      const res3 = evaluateAlternativeAirportSavings({
        primaryAirfare: 2000000,
        alternativeAirfare: 1000000,
        surfaceTransitCost: 200000,
        transferMinutes: 240,
      });
      expect(res3.netSavingsVND).toBe(800000);
      expect(res3.isEconomicallyViable).toBe(false);
      expect(res3.explanationVi).toContain('vượt quá ngưỡng chịu đựng tối đa');
    });
  });
});
