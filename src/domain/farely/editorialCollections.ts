/**
 * F42: Deal Curation and Editorial Collections (Tier P2)
 *
 * Requirements:
 * - Solution: Human-reviewable collections based on evidence, freshness and expiry.
 * - Acceptance Invariant: No fabricated scarcity or unsupported featured discount.
 */

export class FabricatedScarcityError extends Error {
  constructor(message: string) {
    super(`[F42_FABRICATED_SCARCITY_VIOLATION] ${message}`);
    this.name = 'FabricatedScarcityError';
  }
}

export class UnsupportedFeaturedDiscountError extends Error {
  constructor(message: string) {
    super(`[F42_UNSUPPORTED_DISCOUNT_VIOLATION] ${message}`);
    this.name = 'UnsupportedFeaturedDiscountError';
  }
}

export class StaleCuratedItemError extends Error {
  constructor(message: string) {
    super(`[F42_STALE_CURATED_ITEM_VIOLATION] ${message}`);
    this.name = 'StaleCuratedItemError';
  }
}

export type CollectionTheme =
  | 'WEEKEND_GETAWAY'
  | 'FAMILY_HOLIDAY'
  | 'TET_PEAK_SAVINGS'
  | 'BEACH_AND_ISLANDS'
  | 'BUDGET_DISCOVERY';

export interface CuratorMetadata {
  curatorId: string;
  name: string;
  role: string;
  signedAt: string; // ISO 8601
}

export interface CuratedDealInput {
  dealId: string;
  originCode: string;
  destinationCode: string;
  airlineCode: string;
  advertisedPriceVND: number;
  cohortMedianPriceVND: number;
  claimedDiscountPercent?: number;
  observedAt: string; // ISO 8601
  scarcityClaim?: {
    seatsRemaining?: number;
    claimTextVi: string;
    hasProviderInventoryProof: boolean;
  };
  editorNotesVi: string;
}

export interface ValidatedCuratedItem {
  dealId: string;
  routeKey: string;
  airlineCode: string;
  advertisedPriceVND: number;
  cohortMedianPriceVND: number;
  calculatedDiscountPercent: number;
  hasVerifiedScarcity: boolean;
  scarcityLabelVi?: string;
  editorNotesVi: string;
  observedAt: string;
}

export interface EditorialCollection {
  collectionId: string;
  titleVi: string;
  summaryVi: string;
  theme: CollectionTheme;
  curator: CuratorMetadata;
  expiresAt: string; // ISO 8601
  items: ValidatedCuratedItem[];
  isCurrentlyActive: boolean;
  totalDealsCount: number;
}

const MAX_DEAL_AGE_HOURS_FOR_EDITORIAL = 24;

/**
 * Validates whether an observed fare timestamp is within the 24-hour editorial freshness ceiling.
 */
export function validateCuratedItemFreshness(observedAt: string, currentTimestampIso?: string): void {
  const nowMs = currentTimestampIso ? Date.parse(currentTimestampIso) : Date.now();
  const observedMs = Date.parse(observedAt);
  if (!Number.isFinite(observedMs) || observedMs > nowMs + 60000) {
    throw new StaleCuratedItemError("Thời điểm quan sát giá không hợp lệ hoặc nằm trong tương lai.");
  }
  const ageHours = (nowMs - observedMs) / (1000 * 60 * 60);
  if (ageHours > MAX_DEAL_AGE_HOURS_FOR_EDITORIAL) {
    throw new StaleCuratedItemError(
      `Ưu đãi được quan sát ${Math.round(ageHours)} giờ trước, vượt quá giới hạn tối đa ${MAX_DEAL_AGE_HOURS_FOR_EDITORIAL} giờ cho bộ sưu tập tuyển chọn.`
    );
  }
}

/**
 * Validates curated deal items against authentic observation evidence.
 * Enforces strict anti-fabrication invariants (F42).
 */
export function validateAndPublishEditorialCollection(params: {
  collectionId: string;
  titleVi: string;
  summaryVi: string;
  theme: CollectionTheme;
  curator: CuratorMetadata;
  expiresAt: string;
  items: CuratedDealInput[];
  nowIsoString?: string;
}): EditorialCollection {
  const {
    collectionId,
    titleVi,
    summaryVi,
    theme,
    curator,
    expiresAt,
    items,
    nowIsoString = new Date().toISOString(),
  } = params;

  if (!items || items.length === 0) {
    throw new Error('Editorial collection must contain at least one curated item.');
  }

  if (!curator || !curator.curatorId || !curator.name || !curator.signedAt || !curator.role || curator.role.trim().length < 3) {
    throw new Error('Thông tin biên tập viên (curatorId, name, role, signedAt) không được để trống hoặc thiếu hợp lệ.');
  }

  const signedMs = Date.parse(curator.signedAt);
  if (!Number.isFinite(signedMs)) {
    throw new Error('Dấu thời gian ký duyệt của biên tập viên (curator.signedAt) không hợp lệ.');
  }

  const nowMs = Date.parse(nowIsoString);
  const expiresMs = Date.parse(expiresAt);

  if (!Number.isFinite(expiresMs)) {
    throw new Error('Thời điểm hết hạn bộ sưu tập (expiresAt) không hợp lệ.');
  }

  if (expiresMs <= signedMs) {
    throw new Error('Collection expiration must be strictly after curator signature timestamp.');
  }

  const validatedItems: ValidatedCuratedItem[] = items.map((item) => {
    // 0. Boundary integrity: Reject circular route and invalid advertised price
    if (item.originCode.trim().toUpperCase() === item.destinationCode.trim().toUpperCase()) {
      throw new Error(`[F42_CIRCULAR_ROUTE_VIOLATION] [dealId=${item.dealId}] Tuyến bay không hợp lệ (điểm đi và điểm đến trùng nhau: ${item.originCode}).`);
    }

    if (!Number.isInteger(item.advertisedPriceVND) || item.advertisedPriceVND <= 0) {
      throw new Error(`[F42_INVALID_PRICE_VIOLATION] [dealId=${item.dealId}] Giá quảng cáo phải là số nguyên dương (${item.advertisedPriceVND}đ).`);
    }

    // 1. Freshness check: Reject obsolete deals (> 24h old) or future-dated anomalies
    validateCuratedItemFreshness(item.observedAt, nowIsoString);

    // 2. Discount validity check: Verify claimed discount does not exceed authentic calculation
    if (!Number.isFinite(item.cohortMedianPriceVND) || item.cohortMedianPriceVND <= 0) {
      throw new UnsupportedFeaturedDiscountError(
        `[dealId=${item.dealId}] Deal ${item.dealId} có giá trung vị nhóm không hợp lệ hoặc bằng 0 (${item.cohortMedianPriceVND}).`
      );
    }

    const trueDiscountPercent = Math.max(
      0,
      Math.round(
        ((item.cohortMedianPriceVND - item.advertisedPriceVND) / item.cohortMedianPriceVND) * 100
      )
    );

    if (item.claimedDiscountPercent !== undefined) {
      if (item.claimedDiscountPercent <= 0 || !Number.isFinite(item.claimedDiscountPercent)) {
        throw new UnsupportedFeaturedDiscountError(
          `[dealId=${item.dealId}] Deal ${item.dealId} công bố tỷ lệ giảm giá không hợp lệ (${item.claimedDiscountPercent}%). Tỷ lệ giảm giá phải là số dương lớn hơn 0%.`
        );
      }
      // Claiming higher discount than authentic data permits (> 1% tolerance for rounding)
      if (item.claimedDiscountPercent > trueDiscountPercent + 1) {
        throw new UnsupportedFeaturedDiscountError(
          `[dealId=${item.dealId}] Deal ${item.dealId} claims discount of ${item.claimedDiscountPercent}% but authentic cohort calculation only supports ${trueDiscountPercent}% (Price: ${item.advertisedPriceVND}₫ vs Cohort: ${item.cohortMedianPriceVND}₫).`
        );
      }
    }

    // 3. Scarcity claims check: Forbid fake urgency without inventory evidence
    let hasVerifiedScarcity = false;
    let scarcityLabelVi: string | undefined;

    if (item.scarcityClaim) {
      if (
        !item.scarcityClaim.hasProviderInventoryProof ||
        item.scarcityClaim.seatsRemaining === undefined ||
        !Number.isInteger(item.scarcityClaim.seatsRemaining) ||
        item.scarcityClaim.seatsRemaining < 1 ||
        item.scarcityClaim.seatsRemaining > 500 ||
        !item.scarcityClaim.claimTextVi ||
        item.scarcityClaim.claimTextVi.trim().length < 3
      ) {
        throw new FabricatedScarcityError(
          `[dealId=${item.dealId}] Deal ${item.dealId} asserts invalid or unverified scarcity claim "${item.scarcityClaim.claimTextVi}". Provider inventory proof and valid seat count (1-500) are mandatory.`
        );
      }
      hasVerifiedScarcity = true;
      scarcityLabelVi = item.scarcityClaim.claimTextVi.trim();
    }

    return {
      dealId: item.dealId,
      routeKey: `${item.originCode.trim().toUpperCase()}-${item.destinationCode.trim().toUpperCase()}`,
      airlineCode: item.airlineCode,
      advertisedPriceVND: item.advertisedPriceVND,
      cohortMedianPriceVND: item.cohortMedianPriceVND,
      calculatedDiscountPercent: trueDiscountPercent,
      hasVerifiedScarcity,
      scarcityLabelVi,
      editorNotesVi: item.editorNotesVi,
      observedAt: item.observedAt,
    };
  });

  const isCurrentlyActive = nowMs < expiresMs;

  return {
    collectionId,
    titleVi,
    summaryVi,
    theme,
    curator,
    expiresAt,
    items: validatedItems,
    isCurrentlyActive,
    totalDealsCount: validatedItems.length,
  };
}
