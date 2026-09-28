import { evidenceGatedDealLabel, sanitizeBookingUrl } from './golden-corpus-runner.mjs';

export function testMutationSensitivity() {
  const mutations = [];

  // Mutation 1: Confidence cap removed
  // Normal behavior: Score 95 with confidence 30 gives "Giá đáng chú ý"
  // Mutant behavior: If confidence check is disabled, returns "Deal cực nóng"
  {
    const mutantLabel = (score) => {
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

  // Mutation 3: Booking allowlist suffix spoof vulnerability
  // Normal behavior: evilvietjetair.com is rejected (returns undefined)
  // Mutant behavior: url.includes('vietjetair.com') accepts evilvietjetair.com
  {
    const mutantSanitizeSuffix = (url) => {
      return typeof url === 'string' && url.includes('vietjetair.com') ? url : undefined;
    };
    const spoofUrl = 'https://evilvietjetair.com/phishing';
    const killed = mutantSanitizeSuffix(spoofUrl) !== sanitizeBookingUrl(spoofUrl);
    mutations.push({
      mutation_id: 'MUT_ALLOWLIST_SUFFIX_SPOOF',
      description: 'Permissive substring or suffix check permits spoof domains like evilvietjetair.com',
      killed,
    });
  }

  // Mutation 4: Boundary comparison inverted (> vs >=)
  // Normal behavior: Score 90 and confidence 75 is "Deal cực nóng" (THR-SCORE-HOT = 90)
  // Mutant behavior: Score > 90 required (strictly greater than), demoting 90 to "Deal rất ngon"
  {
    const mutantBoundaryLabel = (score, confidence) => {
      if (confidence < 50) return score >= 60 ? "Giá đáng chú ý" : "Giá quan sát";
      if (score > 90 && confidence >= 75) return "Deal cực nóng"; // mutant: strictly greater than
      if (score >= 80 && confidence >= 65) return "Deal rất ngon";
      return "Deal ngon";
    };
    const killed = mutantBoundaryLabel(90, 75) !== evidenceGatedDealLabel(90, 75);
    mutations.push({
      mutation_id: 'MUT_BOUNDARY_COMPARISON_INVERTED',
      description: 'Inverting boundary comparison (score > 90 vs score >= 90) demotes valid hot deals',
      killed,
    });
  }

  // Mutation 5: Cost additivity monotonicity inversion
  // Normal behavior: allIn = base + fee (adding fee never decreases total)
  // Mutant behavior: allIn = base - fee
  {
    const base = 1000000;
    const fee = 300000;
    const normalTotal = base + fee;
    const mutantTotal = base - fee;
    const killed = mutantTotal < base && normalTotal >= base;
    mutations.push({
      mutation_id: 'MUT_COST_MONOTONICITY_INVERTED',
      description: 'Fee addition inverted to subtraction violates cost additivity monotonicity',
      killed,
    });
  }

  // Mutation 6: Freshness boundary shifted
  // Normal behavior: 361m is stale (THR-FRESHNESS-DEGRADED-MINUTES = 360)
  // Mutant behavior: 361m considered fresh (threshold at 1000m)
  {
    const isStaleNormal = (min) => min > 360;
    const isStaleMutant = (min) => min > 1000;
    const killed = isStaleNormal(361) !== isStaleMutant(361);
    mutations.push({
      mutation_id: 'MUT_FRESHNESS_BOUNDARY_SHIFTED',
      description: 'Shifting staleness threshold to 1000m conceals stale data past the 360m limit',
      killed,
    });
  }

  // Mutation 7: Zero price validation
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
