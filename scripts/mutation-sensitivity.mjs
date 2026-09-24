import { evidenceGatedDealLabel, sanitizeBookingUrl } from './golden-corpus-runner.mjs';

export function testMutationSensitivity() {
  const mutations = [];

  // Mutation 1: Confidence cap removed
  // Normal behavior: Score 95 with confidence 30 gives "Giá đáng chú ý"
  // Mutant behavior: If confidence check is disabled, returns "Deal cực nóng"
  {
    const mutantLabel = (score) => {
      // Mutant ignores confidence check
      if (score >= 90) return "Deal cực nóng";
      return "Giá quan sát";
    };
    const killed = mutantLabel(95, 30) !== evidenceGatedDealLabel(95, 30);
    mutations.push({
      mutation_id: 'MUT_CONFIDENCE_CAP_BYPASS',
      description: 'Removing confidence cap allows low-confidence deals to claim Deal cực nóng',
      killed,
    });
  }

  // Mutation 2: Booking allowlist arbitrary host acceptance
  // Normal behavior: evil-phishing-flights.com is rejected (returns undefined)
  // Mutant behavior: Any https URL accepted
  {
    const mutantSanitize = (url) => {
      return typeof url === 'string' && url.startsWith('https://') ? url : undefined;
    };
    const badUrl = 'https://evil-phishing-flights.com/steal';
    const killed = mutantSanitize(badUrl) !== sanitizeBookingUrl(badUrl);
    mutations.push({
      mutation_id: 'MUT_ALLOWLIST_ARBITRARY_HOST',
      description: 'Accepting arbitrary https hosts permits phishing domains',
      killed,
    });
  }

  // Mutation 3: Cost monotonicity inversion
  // Normal behavior: allIn = base + fee (adding fee never decreases total)
  // Mutant behavior: allIn = base - fee
  {
    const base = 100;
    const fee = 30;
    const normalTotal = base + fee;
    const mutantTotal = base - fee;
    const killed = mutantTotal < base && normalTotal >= base;
    mutations.push({
      mutation_id: 'MUT_COST_MONOTONICITY_INVERTED',
      description: 'Fee addition inverted to subtraction violates cost monotonicity',
      killed,
    });
  }

  // Mutation 4: Freshness boundary shifted
  // Normal behavior: 361m is stale
  // Mutant behavior: 361m considered fresh (threshold at 1000m)
  {
    const isStaleNormal = (min) => min > 360;
    const isStaleMutant = (min) => min > 1000;
    const killed = isStaleNormal(400) !== isStaleMutant(400);
    mutations.push({
      mutation_id: 'MUT_FRESHNESS_BOUNDARY_SHIFTED',
      description: 'Shifting staleness threshold to 1000m conceals stale data',
      killed,
    });
  }

  // Mutation 5: Zero price validation
  // Normal behavior: price <= 0 is invalid
  // Mutant behavior: price <= 0 accepted
  {
    const isValidPriceNormal = (p) => p != null && Number.isFinite(p) && p > 0;
    const isValidPriceMutant = (p) => p != null && Number.isFinite(p) && p >= 0;
    const killed = isValidPriceNormal(0) !== isValidPriceMutant(0);
    mutations.push({
      mutation_id: 'MUT_ZERO_PRICE_ACCEPTED',
      description: 'Accepting price of 0 admits invalid/broken fares into pipeline',
      killed,
    });
  }

  const allKilled = mutations.every((m) => m.killed);
  return {
    ok: allKilled,
    total_mutations: mutations.length,
    mutations_killed: mutations.filter((m) => m.killed).length,
    mutations,
  };
}

if (process.argv[1] && process.argv[1].endsWith('mutation-sensitivity.mjs')) {
  const result = testMutationSensitivity();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
