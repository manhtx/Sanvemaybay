import { describe, it, expect } from 'vitest';
import {
  evaluateWatchCondition,
  type WatchConditionEpisode,
} from './watchCondition.ts';

describe('WP03: Pure Domain Kernel — Watch Condition State Machine (NC-017..019)', () => {
  const watchId = 'watch_sgnhan_100';
  const targetPrice = 2_000_000;
  const now = '2026-10-27T12:00:00.000Z';

  describe('Full Lifecycle State Machine Chain (ENTERED -> STILL_INSIDE -> MATERIAL_IMPROVEMENT -> EXITED -> REENTERED)', () => {
    it('executes unbroken state transition lifecycle with strict alert calibration', () => {
      // Step 1: Initial observation meets target -> ENTERED
      const step1 = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 1_800_000,
        activeEpisode: null,
        now,
      });

      expect(step1.stateChanged).toBe(true);
      expect(step1.shouldAlert).toBe(true);
      expect(step1.nextEpisode).not.toBeNull();
      expect(step1.nextEpisode?.state).toBe('ENTERED');
      expect(step1.nextEpisode?.entryPrice).toBe(1_800_000);
      expect(step1.nextEpisode?.bestPrice).toBe(1_800_000);
      expect(step1.nextEpisode?.closedAt).toBeNull();

      const ep1 = step1.nextEpisode!;

      // Step 2: Price drops mildly (1_750_000, 2.7% drop < 5%) -> STILL_INSIDE (no alert spam)
      const step2 = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 1_750_000,
        activeEpisode: ep1,
        now: '2026-10-27T13:00:00.000Z',
      });

      expect(step2.stateChanged).toBe(false);
      expect(step2.shouldAlert).toBe(false);
      expect(step2.nextEpisode?.state).toBe('STILL_INSIDE');
      expect(step2.nextEpisode?.bestPrice).toBe(1_750_000);

      const ep2 = step2.nextEpisode!;

      // Step 3: Material price drop (>5% drop from previous best 1_750_000 -> 1_600_000 is 8.5% drop) -> MATERIAL_IMPROVEMENT (NC-019)
      const step3 = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 1_600_000,
        activeEpisode: ep2,
        now: '2026-10-27T14:00:00.000Z',
      });

      expect(step3.stateChanged).toBe(true);
      expect(step3.shouldAlert).toBe(true);
      expect(step3.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
      expect(step3.nextEpisode?.bestPrice).toBe(1_600_000);

      const ep3 = step3.nextEpisode!;

      // Step 4: Price rises above target (2_100_000 > 2_000_000) -> EXITED (NC-017)
      const step4 = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 2_100_000,
        activeEpisode: ep3,
        now: '2026-10-27T15:00:00.000Z',
      });

      expect(step4.stateChanged).toBe(true);
      expect(step4.shouldAlert).toBe(false);
      expect(step4.nextEpisode?.state).toBe('EXITED');
      expect(step4.nextEpisode?.closedAt).toBe('2026-10-27T15:00:00.000Z');

      const ep4 = step4.nextEpisode!;

      // Step 5: Price remains above target -> stays EXITED
      const step5 = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 2_200_000,
        activeEpisode: ep4,
        now: '2026-10-27T16:00:00.000Z',
      });

      expect(step5.stateChanged).toBe(false);
      expect(step5.shouldAlert).toBe(false);
      expect(step5.nextEpisode?.state).toBe('EXITED');

      // Step 6: Price drops back below target (1_900_000 <= 2_000_000) -> REENTERED (NC-018)
      const step6 = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 1_900_000,
        activeEpisode: ep4,
        now: '2026-10-27T17:00:00.000Z',
      });

      expect(step6.stateChanged).toBe(true);
      expect(step6.shouldAlert).toBe(true);
      expect(step6.nextEpisode?.state).toBe('REENTERED');
      expect(step6.nextEpisode?.closedAt).toBeNull();
      expect(step6.nextEpisode?.entryPrice).toBe(1_900_000);
      expect(step6.nextEpisode?.bestPrice).toBe(1_900_000);
    });
  });

  describe('Hostile Input Defenses & Negative Vector Hardening', () => {
    it('fails closed to INSUFFICIENT_EVIDENCE on non-positive or non-finite prices (NV04/NV20)', () => {
      const active: WatchConditionEpisode = {
        id: 'ep_1',
        watchId,
        conditionFingerprint: 'cond_1',
        openedAt: now,
        closedAt: null,
        state: 'ENTERED',
        entryPrice: 1_800_000,
        bestPrice: 1_800_000,
        lastEventAt: now,
      };

      // Negative price must NEVER trigger false ENTERED or drop alert
      const negResult = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: -500_000,
        activeEpisode: active,
      });
      expect(negResult.nextEpisode).toBe(active);
      expect(negResult.stateChanged).toBe(false);
      expect(negResult.shouldAlert).toBe(false);
      expect(negResult.transitionReason).toContain('INSUFFICIENT_EVIDENCE');

      // Zero price must also fail closed
      const zeroResult = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 0,
        activeEpisode: active,
      });
      expect(zeroResult.stateChanged).toBe(false);
      expect(zeroResult.shouldAlert).toBe(false);

      // NaN or null
      const nanResult = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: NaN,
        activeEpisode: active,
      });
      expect(nanResult.stateChanged).toBe(false);
      expect(nanResult.shouldAlert).toBe(false);
    });

    it('preserves episode intact when conditionInput is explicitly INSUFFICIENT_EVIDENCE', () => {
      const active: WatchConditionEpisode = {
        id: 'ep_2',
        watchId,
        conditionFingerprint: 'cond_2',
        openedAt: now,
        closedAt: null,
        state: 'STILL_INSIDE',
        entryPrice: 1_800_000,
        bestPrice: 1_700_000,
        lastEventAt: now,
      };

      const result = evaluateWatchCondition({
        watchId,
        targetPrice,
        conditionInput: 'INSUFFICIENT_EVIDENCE',
        activeEpisode: active,
      });

      expect(result.nextEpisode).toBe(active);
      expect(result.stateChanged).toBe(false);
      expect(result.shouldAlert).toBe(false);
      expect(result.transitionReason).toContain('INSUFFICIENT_EVIDENCE');
    });

    it('closes prior episode when generationId mismatch occurs (epoch boundary isolation)', () => {
      const gen1Episode: WatchConditionEpisode = {
        id: 'ep_gen1',
        watchId,
        conditionFingerprint: 'cond_gen1',
        openedAt: now,
        closedAt: null,
        state: 'ENTERED',
        entryPrice: 1_800_000,
        bestPrice: 1_800_000,
        lastEventAt: now,
        generationId: 'gen_epoch_1',
      };

      // User modified criteria -> generation epoch 2
      const result = evaluateWatchCondition({
        watchId,
        targetPrice: 1_500_000,
        observedPrice: 1_400_000,
        activeEpisode: gen1Episode,
        generationId: 'gen_epoch_2',
        now: '2026-10-27T18:00:00.000Z',
      });

      expect(result.stateChanged).toBe(true);
      expect(result.shouldAlert).toBe(false);
      expect(result.nextEpisode?.state).toBe('EXITED');
      expect(result.nextEpisode?.closedAt).toBe('2026-10-27T18:00:00.000Z');
      expect(result.transitionReason).toContain('GENERATION_EPOCH_MISMATCH');
    });

    it('self-heals corrupted non-positive active.bestPrice without NaN drops', () => {
      const corruptedEpisode: WatchConditionEpisode = {
        id: 'ep_corrupt',
        watchId,
        conditionFingerprint: 'cond_corrupt',
        openedAt: now,
        closedAt: null,
        state: 'ENTERED',
        entryPrice: 1_800_000,
        bestPrice: 0, // Corrupted in storage
        lastEventAt: now,
      };

      const result = evaluateWatchCondition({
        watchId,
        targetPrice,
        observedPrice: 1_600_000,
        activeEpisode: corruptedEpisode,
        now,
      });

      // Self-heals using entryPrice (1.8M -> 1.6M is >5% drop) -> triggers MATERIAL_IMPROVEMENT
      expect(result.stateChanged).toBe(true);
      expect(result.shouldAlert).toBe(true);
      expect(result.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
      expect(result.nextEpisode?.bestPrice).toBe(1_600_000);
    });
  });
});
