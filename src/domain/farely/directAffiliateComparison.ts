/**
 * F43: Direct/Affiliate Provider Comparison (Tier P2)
 *
 * Requirements:
 * - Solution: Compare actual provider quote basis, refresh state, link class, partner rights and disclosures.
 * - Acceptance Invariant: Commercial ranking does not override undisclosed objective cheapest result.
 */

export class CommercialRankingOverrideError extends Error {
  constructor(message: string) {
    super(`[F43_COMMERCIAL_RANKING_OVERRIDE_VIOLATION] ${message}`);
    this.name = 'CommercialRankingOverrideError';
  }
}

export type ProviderChannelType =
  | 'DIRECT_AIRLINE'        // Direct airline official website
  | 'OTA_PARTNER'          // Online Travel Agent (Traveloka, Trip.com, etc.)
  | 'AFFILIATE_AGGREGATOR'; // Metasearch / affiliate referral (Skyscanner, Kayak, etc.)

export type QuoteBasis =
  | 'BASE_FARE_ONLY'
  | 'TOTAL_INCLUSIVE_NO_BAGGAGE'
  | 'ALL_INCLUSIVE_WITH_BAGGAGE';

export type DeepLinkClass =
  | 'DEEP_LINK_EXACT_OFFER'   // Deep links directly to checkout/fare summary
  | 'SEARCH_RESULTS_PREFILLED'// Pre-fills origin, destination, dates, passengers
  | 'PROVIDER_HOMEPAGE_GENERIC'; // Generic fallback homepage

export interface ProviderQuoteInput {
  providerId: string;
  providerName: string;
  channelType: ProviderChannelType;
  quoteBasis: QuoteBasis;
  rawQuotedPriceVND: number;
  mandatoryTaxesAndFeesVND: number;
  checkedBaggageFeeVND: number;
  isBaggageIncludedInQuote: boolean;
  deepLinkClass: DeepLinkClass;
  deepLinkUrl: string;
  isCommercialPartner: boolean;
  affiliateCommissionRatePercent?: number; // e.g., 3.5%
  observedAt: string; // ISO 8601
}

export interface NormalizedProviderChannel {
  providerId: string;
  providerName: string;
  channelType: ProviderChannelType;
  quoteBasis: QuoteBasis;
  rawQuotedPriceVND: number;
  normalizedTotalCostVND: number;
  breakdown: {
    baseFareVND: number;
    mandatoryTaxesAndFeesVND: number;
    baggageFeeVND: number;
  };
  isObjectiveCheapest: boolean;
  commercialStatusVi: string;
  deepLinkClass: DeepLinkClass;
  deepLinkUrl: string;
  stalenessMinutes: number;
}

export interface DirectAffiliateComparisonResult {
  flightKey: string;
  channels: NormalizedProviderChannel[];
  objectiveCheapestProviderId: string;
  directAirlineProviderId?: string;
  cheapestChannelSavingsVsDirectVND: number;
  disclosureNoticeVi: string;
  cheapestChannelType: ProviderChannelType;
  totalChannelsCompared: number;
  isDirectCheaperOrEqual: boolean;
}

const CHANNEL_PRIORITY_ORDER: Record<ProviderChannelType, number> = {
  DIRECT_AIRLINE: 1,
  OTA_PARTNER: 2,
  AFFILIATE_AGGREGATOR: 3,
};

/**
 * Validates whether a deep link URL is well-formed with a safe http/https protocol.
 */
export function isValidDeepLinkUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Normalizes provider quotes across direct and affiliate channels.
 * Enforces strict invariant: Commercial ranking can NEVER override
 * or misrepresent the objective cheapest result (F43).
 */
export function compareProviderChannels(params: {
  flightKey: string;
  quotes: ProviderQuoteInput[];
  requiresCheckedBaggage?: boolean;
  nowIsoString?: string;
}): DirectAffiliateComparisonResult {
  const { flightKey, quotes, requiresCheckedBaggage = false, nowIsoString = new Date().toISOString() } = params;

  if (!quotes || quotes.length === 0) {
    throw new Error('At least one provider quote is required for channel comparison.');
  }

  // 0. SRE rigor: validate finite numeric bounds and quote invariants
  for (const q of quotes) {
    if (!Number.isFinite(q.rawQuotedPriceVND) || q.rawQuotedPriceVND <= 0) {
      throw new Error(`Invalid rawQuotedPriceVND for provider ${q.providerId}: must be positive finite number.`);
    }
    if (!Number.isFinite(q.mandatoryTaxesAndFeesVND) || q.mandatoryTaxesAndFeesVND < 0) {
      throw new Error(`Invalid mandatoryTaxesAndFeesVND for provider ${q.providerId}: must be non-negative finite number.`);
    }
    if (!Number.isFinite(q.checkedBaggageFeeVND) || q.checkedBaggageFeeVND < 0) {
      throw new Error(`Invalid checkedBaggageFeeVND for provider ${q.providerId}: must be non-negative finite number.`);
    }
    if (q.quoteBasis !== 'BASE_FARE_ONLY' && q.rawQuotedPriceVND < q.mandatoryTaxesAndFeesVND) {
      throw new Error(`Provider ${q.providerId} quoted price (${q.rawQuotedPriceVND}) cannot be lower than mandatory taxes (${q.mandatoryTaxesAndFeesVND}).`);
    }
    if (q.quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE') {
      const minRequired = q.mandatoryTaxesAndFeesVND + (q.isBaggageIncludedInQuote ? q.checkedBaggageFeeVND : 0);
      if (q.rawQuotedPriceVND < minRequired) {
        throw new Error(
          `Provider ${q.providerId} all-inclusive price (${q.rawQuotedPriceVND}) cannot be lower than mandatory taxes plus baggage fees (${minRequired}).`
        );
      }
    }
    if (q.affiliateCommissionRatePercent !== undefined) {
      if (
        !Number.isFinite(q.affiliateCommissionRatePercent) ||
        q.affiliateCommissionRatePercent < 0 ||
        q.affiliateCommissionRatePercent > 100
      ) {
        throw new Error(
          `Invalid affiliateCommissionRatePercent for provider ${q.providerId}: must be a finite number between 0 and 100.`
        );
      }
    }
    if (!isValidDeepLinkUrl(q.deepLinkUrl)) {
      throw new Error(
        `Invalid or unsafe deepLinkUrl for provider ${q.providerId}: must be a valid http or https URL (received: "${q.deepLinkUrl}").`
      );
    }
  }

  const nowMs = new Date(nowIsoString).getTime();

  // 1. Calculate normalized total cost for each channel with integer VND arithmetic
  const normalizedList: NormalizedProviderChannel[] = quotes.map((q) => {
    const rawPrice = Math.round(q.rawQuotedPriceVND);
    const taxes = Math.round(q.mandatoryTaxesAndFeesVND);
    const baggageFee = Math.round(q.checkedBaggageFeeVND);

    let baseFare = rawPrice;
    let baggage = 0;
    let totalCost = 0;

    const isBaggageIncluded = q.quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE' ? true : q.isBaggageIncludedInQuote;

    if (q.quoteBasis === 'BASE_FARE_ONLY') {
      baseFare = rawPrice;
      if (requiresCheckedBaggage && !isBaggageIncluded) {
        baggage = baggageFee;
      }
      totalCost = baseFare + taxes + baggage;
    } else if (q.quoteBasis === 'TOTAL_INCLUSIVE_NO_BAGGAGE') {
      // Raw price already includes mandatory taxes and fees
      baseFare = Math.max(0, rawPrice - taxes);
      if (requiresCheckedBaggage && !isBaggageIncluded) {
        baggage = baggageFee;
      }
      totalCost = rawPrice + baggage;
    } else {
      // ALL_INCLUSIVE_WITH_BAGGAGE: already includes taxes and baggage
      const includedBaggage = isBaggageIncluded ? baggageFee : 0;
      baggage = includedBaggage;
      baseFare = Math.max(0, rawPrice - taxes - baggage);
      totalCost = rawPrice;
    }

    const observedTime = new Date(q.observedAt).getTime();
    const stalenessMinutes = Number.isFinite(observedTime) && Number.isFinite(nowMs)
      ? Math.max(0, Math.round((nowMs - observedTime) / (1000 * 60)))
      : 0;

    let commercialStatusVi = 'Kênh bán trực tiếp chính thức';
    if (q.channelType === 'OTA_PARTNER') {
      commercialStatusVi = q.isCommercialPartner
        ? 'Đại lý du lịch trực tuyến (Đối tác thương mại Farely)'
        : 'Đại lý du lịch trực tuyến (Khách quan)';
    } else if (q.channelType === 'AFFILIATE_AGGREGATOR') {
      commercialStatusVi = 'Kênh đối sánh liên kết (Affiliate)';
    }

    return {
      providerId: q.providerId,
      providerName: q.providerName,
      channelType: q.channelType,
      quoteBasis: q.quoteBasis,
      rawQuotedPriceVND: rawPrice,
      normalizedTotalCostVND: Math.round(totalCost),
      breakdown: {
        baseFareVND: Math.round(baseFare),
        mandatoryTaxesAndFeesVND: taxes,
        baggageFeeVND: baggage,
      },
      isObjectiveCheapest: false, // will mark below
      commercialStatusVi,
      deepLinkClass: q.deepLinkClass,
      deepLinkUrl: q.deepLinkUrl.trim(),
      stalenessMinutes,
    };
  });

  // 2. Identify the mathematical objective cheapest total cost
  let minCost = Infinity;
  for (const c of normalizedList) {
    if (c.normalizedTotalCostVND < minCost) {
      minCost = c.normalizedTotalCostVND;
    }
  }

  // Mark all channels achieving the minimum cost
  for (const c of normalizedList) {
    if (c.normalizedTotalCostVND === minCost) {
      c.isObjectiveCheapest = true;
    }
  }

  // 3. Sort channels objectively with deterministic 4-tier comparator:
  // Tier 1: normalizedTotalCostVND ascending
  // Tier 2: channelType priority (DIRECT_AIRLINE > OTA_PARTNER > AFFILIATE_AGGREGATOR)
  // Tier 3: providerName alphabetical
  // Tier 4: providerId alphabetical
  normalizedList.sort((a, b) => {
    if (a.normalizedTotalCostVND !== b.normalizedTotalCostVND) {
      return a.normalizedTotalCostVND - b.normalizedTotalCostVND;
    }
    const prioA = CHANNEL_PRIORITY_ORDER[a.channelType] || 99;
    const prioB = CHANNEL_PRIORITY_ORDER[b.channelType] || 99;
    if (prioA !== prioB) return prioA - prioB;
    const nameCmp = a.providerName.localeCompare(b.providerName);
    if (nameCmp !== 0) return nameCmp;
    return a.providerId.localeCompare(b.providerId);
  });

  const objectiveCheapestProviderId = normalizedList[0].providerId;

  // Find direct airline if available
  const directAirline = normalizedList.find((c) => c.channelType === 'DIRECT_AIRLINE');
  const cheapestChannelSavingsVsDirectVND = directAirline
    ? Math.max(0, directAirline.normalizedTotalCostVND - minCost)
    : 0;

  const isDirectCheaperOrEqual = directAirline ? directAirline.normalizedTotalCostVND <= minCost : false;

  return {
    flightKey,
    channels: normalizedList,
    objectiveCheapestProviderId,
    directAirlineProviderId: directAirline?.providerId,
    cheapestChannelSavingsVsDirectVND,
    disclosureNoticeVi:
      'Farely đối sánh độc lập giữa website hãng hàng không và các đại lý. Thứ tự hiển thị luôn ưu tiên chi phí thực tế thấp nhất, hoàn toàn không bị thao túng bởi hoa hồng hay phí đối tác.',
    cheapestChannelType: normalizedList[0].channelType,
    totalChannelsCompared: normalizedList.length,
    isDirectCheaperOrEqual,
  };
}

/**
 * Validates that an advertised "Cheapest" badge or display order complies with F43.
 * Throws CommercialRankingOverrideError if a partner was prioritized over a cheaper option,
 * or if an intermediary displaced an official airline with identical price.
 */
export function assertCommercialRankingIntegrity(
  promotedProviderId: string,
  comparison: DirectAffiliateComparisonResult
): void {
  const promotedChannel = comparison.channels.find((c) => c.providerId === promotedProviderId);
  if (!promotedChannel) {
    throw new CommercialRankingOverrideError(`Promoted provider ${promotedProviderId} not found in channel comparison.`);
  }

  const trueCheapest = comparison.channels.find((c) => c.isObjectiveCheapest);
  if (trueCheapest && promotedChannel.normalizedTotalCostVND > trueCheapest.normalizedTotalCostVND) {
    throw new CommercialRankingOverrideError(
      `Provider "${promotedChannel.providerName}" (${promotedChannel.normalizedTotalCostVND}₫) cannot be designated as cheapest or top-promoted when "${trueCheapest.providerName}" offers a lower price of ${trueCheapest.normalizedTotalCostVND}₫.`
    );
  }

  // F43 Strict Invariant: On identical prices, an intermediary cannot displace an official direct airline
  const directAirline = comparison.channels.find(
    (c) => c.channelType === 'DIRECT_AIRLINE' && c.isObjectiveCheapest
  );
  if (
    directAirline &&
    promotedChannel.channelType !== 'DIRECT_AIRLINE' &&
    promotedChannel.normalizedTotalCostVND === directAirline.normalizedTotalCostVND &&
    promotedChannel.providerId !== directAirline.providerId
  ) {
    throw new CommercialRankingOverrideError(
      `Provider "${promotedChannel.providerName}" (${promotedChannel.normalizedTotalCostVND}₫) cannot be prioritized over direct airline "${directAirline.providerName}" offering the same lowest price without explicit non-commercial rationale.`
    );
  }
}
