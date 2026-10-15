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

  const nowMs = new Date(nowIsoString).getTime();

  // 1. Calculate normalized total cost for each channel
  const normalizedList: NormalizedProviderChannel[] = quotes.map((q) => {
    const baseFare = q.rawQuotedPriceVND;
    const taxes = q.mandatoryTaxesAndFeesVND;
    let baggage = 0;

    if (requiresCheckedBaggage) {
      if (!q.isBaggageIncludedInQuote) {
        baggage = q.checkedBaggageFeeVND;
      }
    }

    const totalCost = baseFare + taxes + baggage;
    const stalenessMinutes = Math.max(
      0,
      Math.round((nowMs - new Date(q.observedAt).getTime()) / (1000 * 60))
    );

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
      rawQuotedPriceVND: q.rawQuotedPriceVND,
      normalizedTotalCostVND: totalCost,
      breakdown: {
        baseFareVND: baseFare,
        mandatoryTaxesAndFeesVND: taxes,
        baggageFeeVND: baggage,
      },
      isObjectiveCheapest: false, // will mark below
      commercialStatusVi,
      deepLinkClass: q.deepLinkClass,
      deepLinkUrl: q.deepLinkUrl,
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

  const cheapestChannels = normalizedList.filter((c) => c.isObjectiveCheapest);
  const objectiveCheapestProviderId = cheapestChannels[0].providerId;

  // Find direct airline if available
  const directAirline = normalizedList.find((c) => c.channelType === 'DIRECT_AIRLINE');
  const cheapestChannelSavingsVsDirectVND = directAirline
    ? Math.max(0, directAirline.normalizedTotalCostVND - minCost)
    : 0;

  // 3. Sort channels objectively by normalized total cost (cheapest first)
  // Strict F43 invariant: Do NOT sort by affiliate commission or partner status!
  normalizedList.sort((a, b) => a.normalizedTotalCostVND - b.normalizedTotalCostVND);

  return {
    flightKey,
    channels: normalizedList,
    objectiveCheapestProviderId,
    directAirlineProviderId: directAirline?.providerId,
    cheapestChannelSavingsVsDirectVND,
    disclosureNoticeVi:
      'Farely đối sánh độc lập giữa website hãng hàng không và các đại lý. Thứ tự hiển thị luôn ưu tiên chi phí thực tế thấp nhất, hoàn toàn không bị thao túng bởi hoa hồng hay phí đối tác.',
  };
}

/**
 * Validates that an advertised "Cheapest" badge or display order complies with F43.
 * Throws CommercialRankingOverrideError if a partner was prioritized over a cheaper option.
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
}
