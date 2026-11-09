import { describe, expect, it } from 'vitest';
import {
  evaluateWatchCondition,
  type WatchConditionEpisode
} from './watchCondition';

describe('Farely Pure Domain Kernel — Watch Condition Episodes (REQ-WATCH-015..032, NC-017, NC-018, NC-019, F18)', () => {
  const watchId = 'w_test_101';
  const targetPrice = 2000000;
  const t0 = '2026-11-09T10:00:00.000Z';
  const t1 = '2026-11-09T11:00:00.000Z';
  const t2 = '2026-11-09T12:00:00.000Z';
  const t3 = '2026-11-09T13:00:00.000Z';

  it('initializes a new episode when observed price is at or below target (ENTERED)', () => {
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1950000,
      activeEpisode: null,
      generationId: 'gen_001',
      now: t0
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true);
    expect(result.nextEpisode).not.toBeNull();
    expect(result.nextEpisode?.state).toBe('ENTERED');
    expect(result.nextEpisode?.entryPrice).toBe(1950000);
    expect(result.nextEpisode?.bestPrice).toBe(1950000);
    expect(result.nextEpisode?.openedAt).toBe(t0);
    expect(result.nextEpisode?.closedAt).toBeNull();
    expect(result.nextEpisode?.generationId).toBe('gen_001');
    expect(result.nextEpisode?.conditionFingerprint).toBe(`cond_${watchId}_${targetPrice}`);
  });

  it('does not create an episode when observed price is above target and no active episode exists', () => {
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2500000,
      activeEpisode: null,
      now: t0
    });

    expect(result.stateChanged).toBe(false);
    expect(result.shouldAlert).toBe(false);
    expect(result.nextEpisode).toBeNull();
  });

  it('handles exact target price boundary (observedPrice === targetPrice)', () => {
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2000000,
      activeEpisode: null,
      now: t0
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true);
    expect(result.nextEpisode?.state).toBe('ENTERED');
    expect(result.nextEpisode?.entryPrice).toBe(2000000);
  });

  it('transitions to STILL_INSIDE with alert spam suppression for minor price drops (< 5%)', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'ENTERED',
      entryPrice: 2000000,
      bestPrice: 2000000,
      lastEventAt: t0
    };

    // 2% drop: 2,000,000 -> 1,960,000 (drop is 40,000 = 2% < 5%)
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1960000,
      activeEpisode,
      now: t1
    });

    expect(result.stateChanged).toBe(false);
    expect(result.shouldAlert).toBe(false);
    expect(result.nextEpisode?.state).toBe('STILL_INSIDE');
    expect(result.nextEpisode?.bestPrice).toBe(1960000);
    expect(result.nextEpisode?.openedAt).toBe(t0);
    expect(result.nextEpisode?.lastEventAt).toBe(t1);
  });

  it('preserves monotonic bestPrice when price fluctuates upward within target', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'STILL_INSIDE',
      entryPrice: 2000000,
      bestPrice: 1800000,
      lastEventAt: t1
    };

    // Price rises to 1,900,000 (still <= targetPrice 2,000,000)
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1900000,
      activeEpisode,
      now: t2
    });

    expect(result.stateChanged).toBe(false);
    expect(result.shouldAlert).toBe(false);
    expect(result.nextEpisode?.state).toBe('STILL_INSIDE');
    // Best price must NOT increase
    expect(result.nextEpisode?.bestPrice).toBe(1800000);
  });

  it('triggers MATERIAL_IMPROVEMENT alert when price drops by >= 5% below bestPrice (NC-019)', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'ENTERED',
      entryPrice: 2000000,
      bestPrice: 2000000,
      lastEventAt: t0
    };

    // Exactly 5% drop: 2,000,000 -> 1,900,000 (100,000 drop = 5.0%)
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1900000,
      activeEpisode,
      now: t1
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true);
    expect(result.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
    expect(result.nextEpisode?.bestPrice).toBe(1900000);
    expect(result.transitionReason).toContain('NC-019');
  });

  it('supports consecutive sequential MATERIAL_IMPROVEMENT drops', () => {
    let episode: WatchConditionEpisode | null = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'ENTERED',
      entryPrice: 2000000,
      bestPrice: 2000000,
      lastEventAt: t0
    };

    // First drop: 2,000,000 -> 1,850,000 (7.5% drop)
    const res1 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1850000,
      activeEpisode: episode,
      now: t1
    });
    expect(res1.stateChanged).toBe(true);
    expect(res1.shouldAlert).toBe(true);
    expect(res1.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
    expect(res1.nextEpisode?.bestPrice).toBe(1850000);
    episode = res1.nextEpisode;

    // Minor drop: 1,850,000 -> 1,820,000 (1.6% drop from 1,850,000)
    const res2 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1820000,
      activeEpisode: episode,
      now: t2
    });
    expect(res2.stateChanged).toBe(false);
    expect(res2.shouldAlert).toBe(false);
    expect(res2.nextEpisode?.state).toBe('STILL_INSIDE');
    expect(res2.nextEpisode?.bestPrice).toBe(1820000);
    episode = res2.nextEpisode;

    // Second material drop: 1,820,000 -> 1,700,000 (6.59% drop from best 1,820,000)
    const res3 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1700000,
      activeEpisode: episode,
      now: t3
    });
    expect(res3.stateChanged).toBe(true);
    expect(res3.shouldAlert).toBe(true);
    expect(res3.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
    expect(res3.nextEpisode?.bestPrice).toBe(1700000);
  });

  it('closes active episode when price rises above target (NC-017 EXITED)', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'STILL_INSIDE',
      entryPrice: 1900000,
      bestPrice: 1800000,
      lastEventAt: t1
    };

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2200000,
      activeEpisode,
      now: t2
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(false); // No alert on exit
    expect(result.nextEpisode?.state).toBe('EXITED');
    expect(result.nextEpisode?.closedAt).toBe(t2);
    expect(result.transitionReason).toContain('Episode EXITED');
  });

  it('maintains EXITED state without duplicate stateChanged events when price remains above target', () => {
    const exitedEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: t2,
      state: 'EXITED',
      entryPrice: 1900000,
      bestPrice: 1800000,
      lastEventAt: t2
    };

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2400000,
      activeEpisode: exitedEpisode,
      now: t3
    });

    expect(result.stateChanged).toBe(false);
    expect(result.shouldAlert).toBe(false);
    expect(result.nextEpisode?.state).toBe('EXITED');
    expect(result.nextEpisode?.closedAt).toBe(t2);
  });

  it('re-enters condition when price drops back below target after exit (NC-018 REENTERED)', () => {
    const exitedEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: t2,
      state: 'EXITED',
      entryPrice: 1900000,
      bestPrice: 1800000,
      lastEventAt: t2
    };

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1750000,
      activeEpisode: exitedEpisode,
      now: t3
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true); // Alert triggered on re-entry
    expect(result.nextEpisode?.state).toBe('REENTERED');
    expect(result.nextEpisode?.closedAt).toBeNull();
    expect(result.nextEpisode?.entryPrice).toBe(1750000);
    expect(result.nextEpisode?.bestPrice).toBe(1750000);
    expect(result.transitionReason).toContain('NC-018');
  });

  it('F18: preserves active episode state intact on INSUFFICIENT_EVIDENCE', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'STILL_INSIDE',
      entryPrice: 1900000,
      bestPrice: 1800000,
      lastEventAt: t1
    };

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1800000,
      conditionInput: 'INSUFFICIENT_EVIDENCE',
      activeEpisode,
      now: t2
    });

    expect(result.stateChanged).toBe(false);
    expect(result.shouldAlert).toBe(false);
    expect(result.nextEpisode).toBe(activeEpisode);
    expect(result.nextEpisode?.state).toBe('STILL_INSIDE');
    expect(result.nextEpisode?.closedAt).toBeNull();
    expect(result.transitionReason).toContain('INSUFFICIENT_EVIDENCE');
  });

  it('F18: preserves active episode state intact when observedPrice is null or undefined', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'ENTERED',
      entryPrice: 1900000,
      bestPrice: 1900000,
      lastEventAt: t0
    };

    const resultNull = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: null,
      activeEpisode,
      now: t1
    });

    expect(resultNull.stateChanged).toBe(false);
    expect(resultNull.shouldAlert).toBe(false);
    expect(resultNull.nextEpisode).toBe(activeEpisode);

    const resultUndefined = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: undefined,
      activeEpisode,
      now: t1
    });

    expect(resultUndefined.stateChanged).toBe(false);
    expect(resultUndefined.shouldAlert).toBe(false);
    expect(resultUndefined.nextEpisode).toBe(activeEpisode);
  });

  it('F18 & Adversarial Defense: preserves active episode on NaN or Infinity', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'ENTERED',
      entryPrice: 1900000,
      bestPrice: 1900000,
      lastEventAt: t0
    };

    const resultNaN = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: Number.NaN,
      activeEpisode,
      now: t1
    });
    expect(resultNaN.stateChanged).toBe(false);
    expect(resultNaN.shouldAlert).toBe(false);
    expect(resultNaN.nextEpisode).toBe(activeEpisode);

    const resultInfinity = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: Number.POSITIVE_INFINITY,
      activeEpisode,
      now: t1
    });
    expect(resultInfinity.stateChanged).toBe(false);
    expect(resultInfinity.shouldAlert).toBe(false);
    expect(resultInfinity.nextEpisode).toBe(activeEpisode);
  });

  it('respects CONFIRMED_NON_MATCH conditionInput override to exit episode', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'STILL_INSIDE',
      entryPrice: 1900000,
      bestPrice: 1800000,
      lastEventAt: t1
    };

    // Even if observedPrice is low, explicit CONFIRMED_NON_MATCH exits
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1500000,
      conditionInput: 'CONFIRMED_NON_MATCH',
      activeEpisode,
      now: t2
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(false);
    expect(result.nextEpisode?.state).toBe('EXITED');
    expect(result.nextEpisode?.closedAt).toBe(t2);
  });

  it('respects MATCH conditionInput override to enter episode', () => {
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2500000, // Price above target, but upstream says MATCH (e.g. promotional bundle)
      conditionInput: 'MATCH',
      activeEpisode: null,
      now: t0
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true);
    expect(result.nextEpisode?.state).toBe('ENTERED');
  });

  it('propagates generationId across state transitions for observability audit trails', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'ENTERED',
      entryPrice: 2000000,
      bestPrice: 2000000,
      lastEventAt: t0
    };

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1800000,
      activeEpisode,
      generationId: 'gen_batch_999',
      now: t1
    });

    expect(result.nextEpisode?.generationId).toBe('gen_batch_999');
  });

  it('preserves pure immutability on Object.freeze protected activeEpisode and input parameters', () => {
    const frozenEpisode = Object.freeze({
      id: 'ep_frozen',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'STILL_INSIDE' as const,
      entryPrice: 1950000,
      bestPrice: 1950000,
      lastEventAt: t0,
    });

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1800000,
      activeEpisode: frozenEpisode,
      now: t1,
    });

    expect(result.stateChanged).toBe(true);
    expect(result.nextEpisode?.bestPrice).toBe(1800000);
    expect(frozenEpisode.bestPrice).toBe(1950000);
  });

  it('material price improvement threshold (>= 5% drop): triggers MATERIAL_IMPROVEMENT state and shouldAlert: true', () => {
    const activeEpisode: WatchConditionEpisode = {
      id: 'ep_1',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: null,
      state: 'STILL_INSIDE',
      entryPrice: 2000000,
      bestPrice: 2000000,
      lastEventAt: t0,
    };

    // Exactly 5% drop: 2,000,000 * 0.95 = 1,900,000
    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1900000,
      activeEpisode,
      now: t1,
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true);
    expect(result.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
    expect(result.nextEpisode?.bestPrice).toBe(1900000);
  });

  it('REENTERED state: when a previously EXITED episode sees price drop below target again, triggers REENTERED and shouldAlert: true', () => {
    const exitedEpisode: WatchConditionEpisode = {
      id: 'ep_prev',
      watchId,
      conditionFingerprint: `cond_${watchId}_${targetPrice}`,
      openedAt: t0,
      closedAt: t1,
      state: 'EXITED',
      entryPrice: 1900000,
      bestPrice: 1850000,
      lastEventAt: t1,
    };

    const result = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 1800000,
      activeEpisode: exitedEpisode,
      now: t2,
    });

    expect(result.stateChanged).toBe(true);
    expect(result.shouldAlert).toBe(true);
    expect(result.nextEpisode?.state).toBe('REENTERED');
    expect(result.nextEpisode?.closedAt).toBeNull();
    expect(result.nextEpisode?.entryPrice).toBe(1800000);
  });

  it('processes 10,000 watch condition evaluations within sub-50ms latency budget', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 1900000 - (i % 50000),
        activeEpisode: null,
        now: t0,
      });
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
