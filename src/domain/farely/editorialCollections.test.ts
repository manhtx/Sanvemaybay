import { describe, expect, it } from 'vitest';
import {
  validateAndPublishEditorialCollection,
  validateCuratedItemFreshness,
  FabricatedScarcityError,
  UnsupportedFeaturedDiscountError,
  StaleCuratedItemError,
  EditorialCollection,
  CuratorMetadata,
} from './editorialCollections';

describe('F42: Deal Curation and Editorial Collections', () => {
  const mockCurator: CuratorMetadata = {
    curatorId: 'curator_01',
    name: 'Nguyễn Văn A',
    role: 'Lead Flight Analyst',
    signedAt: '2026-10-15T00:00:00Z',
  };

  const validDealItem = {
    dealId: 'deal_sgn_han_01',
    originCode: 'SGN',
    destinationCode: 'HAN',
    airlineCode: 'VJ',
    advertisedPriceVND: 1_200_000,
    cohortMedianPriceVND: 2_000_000, // 40% discount
    claimedDiscountPercent: 40,
    observedAt: '2026-10-15T02:00:00Z',
    editorNotesVi: 'Giá tốt cho chặng SGN-HAN vào khung giờ sáng sớm.',
  };

  it('publishes a valid evidence-grounded collection with authentic discount calculation', () => {
    const result: EditorialCollection = validateAndPublishEditorialCollection({
      collectionId: 'col_weekend_01',
      titleVi: 'Vé tốt cuối tuần đi Hà Nội',
      summaryVi: 'Tổng hợp các chuyến bay khởi hành sớm với mức giá tốt nhất.',
      theme: 'WEEKEND_GETAWAY',
      curator: mockCurator,
      expiresAt: '2026-10-18T00:00:00Z',
      items: [validDealItem],
      nowIsoString: '2026-10-15T04:00:00Z',
    });

    expect(result.collectionId).toBe('col_weekend_01');
    expect(result.isCurrentlyActive).toBe(true);
    expect(result.items[0].calculatedDiscountPercent).toBe(40);
    expect(result.items[0].hasVerifiedScarcity).toBe(false);
  });

  it('allows verified scarcity when provider inventory proof is provided', () => {
    const result = validateAndPublishEditorialCollection({
      collectionId: 'col_weekend_02',
      titleVi: 'Vé giới hạn có bằng chứng',
      summaryVi: 'Chỉ còn số lượng ghế ít đã được hãng xác nhận.',
      theme: 'BUDGET_DISCOVERY',
      curator: mockCurator,
      expiresAt: '2026-10-18T00:00:00Z',
      items: [
        {
          ...validDealItem,
          scarcityClaim: {
            seatsRemaining: 2,
            claimTextVi: 'Còn 2 ghế giá này trên hệ thống',
            hasProviderInventoryProof: true,
          },
        },
      ],
      nowIsoString: '2026-10-15T04:00:00Z',
    });

    expect(result.items[0].hasVerifiedScarcity).toBe(true);
    expect(result.items[0].scarcityLabelVi).toBe('Còn 2 ghế giá này trên hệ thống');
  });

  it('throws FabricatedScarcityError when scarcity claim lacks provider inventory proof', () => {
    expect(() =>
      validateAndPublishEditorialCollection({
        collectionId: 'col_fake_scarcity',
        titleVi: 'Bộ sưu tập giả mạo độ khan hiếm',
        summaryVi: 'Cố tình tạo sự khẩn cấp giả tạo để ép khách mua.',
        theme: 'LAST_MINUTE_BUDGET' as any,
        curator: mockCurator,
        expiresAt: '2026-10-18T00:00:00Z',
        items: [
          {
            ...validDealItem,
            scarcityClaim: {
              seatsRemaining: 1,
              claimTextVi: 'Chỉ còn duy nhất 1 vé! Nhanh tay kẻo lỡ!',
              hasProviderInventoryProof: false, // FAKE SCARCITY!
            },
          },
        ],
        nowIsoString: '2026-10-15T04:00:00Z',
      })
    ).toThrow(FabricatedScarcityError);
  });

  it('throws UnsupportedFeaturedDiscountError when claimed discount exaggerates true cohort calculation', () => {
    expect(() =>
      validateAndPublishEditorialCollection({
        collectionId: 'col_fake_discount',
        titleVi: 'Giảm giá thổi phồng',
        summaryVi: 'Quảng cáo giảm 70% nhưng thực tế đối sánh chỉ giảm 40%.',
        theme: 'BUDGET_DISCOVERY',
        curator: mockCurator,
        expiresAt: '2026-10-18T00:00:00Z',
        items: [
          {
            ...validDealItem,
            advertisedPriceVND: 1_200_000,
            cohortMedianPriceVND: 2_000_000, // Actual discount: (2M - 1.2M) / 2M = 40%
            claimedDiscountPercent: 70, // FRAUDULENT 70% CLAIM!
          },
        ],
        nowIsoString: '2026-10-15T04:00:00Z',
      })
    ).toThrow(UnsupportedFeaturedDiscountError);
  });

  it('throws StaleCuratedItemError when deal observation age exceeds 48 hours', () => {
    expect(() =>
      validateAndPublishEditorialCollection({
        collectionId: 'col_stale',
        titleVi: 'Vé cũ quá hạn',
        summaryVi: 'Vé đã quét từ 3 ngày trước nhưng vẫn cố đưa vào bộ sưu tập tươi mới.',
        theme: 'BEACH_AND_ISLANDS',
        curator: mockCurator,
        expiresAt: '2026-10-18T00:00:00Z',
        items: [
          {
            ...validDealItem,
            observedAt: '2026-10-11T00:00:00Z', // 4 days ago
          },
        ],
        nowIsoString: '2026-10-15T04:00:00Z',
      })
    ).toThrow(StaleCuratedItemError);
  });

  it('marks isCurrentlyActive = false if collection expiration has passed', () => {
    const result = validateAndPublishEditorialCollection({
      collectionId: 'col_expired',
      titleVi: 'Bộ sưu tập đã hết hạn',
      summaryVi: 'Bộ sưu tập của tuần trước.',
      theme: 'WEEKEND_GETAWAY',
      curator: {
        ...mockCurator,
        signedAt: '2026-10-01T00:00:00Z',
      },
      expiresAt: '2026-10-10T00:00:00Z', // Expired
      items: [validDealItem],
      nowIsoString: '2026-10-15T04:00:00Z',
    });

    expect(result.isCurrentlyActive).toBe(false);
  });

  describe('SOL-CURATION-01: Freshness & Discount Sanity Guards', () => {
    it('validates freshness accurately via validateCuratedItemFreshness', () => {
      const now = '2026-10-15T12:00:00Z';
      const fresh = '2026-10-15T06:00:00Z'; // 6h ago
      const stale = '2026-10-12T00:00:00Z'; // > 48h ago
      const future = '2026-10-16T00:00:00Z'; // future

      expect(() => validateCuratedItemFreshness(fresh, now)).not.toThrow();
      expect(() => validateCuratedItemFreshness(stale, now)).toThrow(StaleCuratedItemError);
      expect(() => validateCuratedItemFreshness(future, now)).toThrow(StaleCuratedItemError);
    });

    it('rejects non-positive cohort median price (SOL-CURATION-01)', () => {
      expect(() =>
        validateAndPublishEditorialCollection({
          collectionId: 'col_invalid_median',
          titleVi: 'Bộ sưu tập lỗi',
          summaryVi: 'Giá trung vị bằng 0',
          theme: 'WEEKEND_GETAWAY',
          curator: mockCurator,
          expiresAt: '2026-10-18T00:00:00Z',
          items: [
            {
              ...validDealItem,
              cohortMedianPriceVND: 0,
            },
          ],
          nowIsoString: '2026-10-15T04:00:00Z',
        })
      ).toThrow(UnsupportedFeaturedDiscountError);
    });

    it('rejects non-positive claimed discount percent (SOL-CURATION-01)', () => {
      expect(() =>
        validateAndPublishEditorialCollection({
          collectionId: 'col_negative_discount',
          titleVi: 'Giảm giá âm',
          summaryVi: 'Claimed discount is negative',
          theme: 'WEEKEND_GETAWAY',
          curator: mockCurator,
          expiresAt: '2026-10-18T00:00:00Z',
          items: [
            {
              ...validDealItem,
              claimedDiscountPercent: -15,
            },
          ],
          nowIsoString: '2026-10-15T04:00:00Z',
        })
      ).toThrow(UnsupportedFeaturedDiscountError);
    });

    it('rejects collection when curator metadata is missing or invalid', () => {
      expect(() =>
        validateAndPublishEditorialCollection({
          collectionId: 'col_no_curator',
          titleVi: 'Thiếu người ký',
          summaryVi: 'Missing curator',
          theme: 'WEEKEND_GETAWAY',
          curator: { curatorId: '', name: '', role: '', signedAt: '' },
          expiresAt: '2026-10-18T00:00:00Z',
          items: [validDealItem],
          nowIsoString: '2026-10-15T04:00:00Z',
        })
      ).toThrow();
    });

    it('rejects circular routes where origin equals destination', () => {
      expect(() =>
        validateAndPublishEditorialCollection({
          collectionId: 'col_circular',
          titleVi: 'Tuyến bay vòng quanh',
          summaryVi: 'Điểm đi trùng điểm đến',
          theme: 'WEEKEND_GETAWAY',
          curator: mockCurator,
          expiresAt: '2026-10-18T00:00:00Z',
          items: [
            {
              ...validDealItem,
              originCode: 'HAN',
              destinationCode: 'HAN',
            },
          ],
          nowIsoString: '2026-10-15T04:00:00Z',
        })
      ).toThrow(/F42_CIRCULAR_ROUTE_VIOLATION/);
    });

    it('rejects non-positive or non-integer advertised prices', () => {
      expect(() =>
        validateAndPublishEditorialCollection({
          collectionId: 'col_invalid_price',
          titleVi: 'Giá vé không hợp lệ',
          summaryVi: 'Giá âm hoặc số lẻ',
          theme: 'WEEKEND_GETAWAY',
          curator: mockCurator,
          expiresAt: '2026-10-18T00:00:00Z',
          items: [
            {
              ...validDealItem,
              advertisedPriceVND: -100000,
            },
          ],
          nowIsoString: '2026-10-15T04:00:00Z',
        })
      ).toThrow(/F42_INVALID_PRICE_VIOLATION/);
    });

    it('rejects scarcity claim with non-integer or out-of-bound seats remaining', () => {
      expect(() =>
        validateAndPublishEditorialCollection({
          collectionId: 'col_bad_seats',
          titleVi: 'Số ghế không hợp lệ',
          summaryVi: 'Số ghế là số thập phân hoặc quá 500',
          theme: 'WEEKEND_GETAWAY',
          curator: mockCurator,
          expiresAt: '2026-10-18T00:00:00Z',
          items: [
            {
              ...validDealItem,
              scarcityClaim: {
                hasProviderInventoryProof: true,
                seatsRemaining: 2.5,
                claimTextVi: 'Còn 2.5 ghế',
              },
            },
          ],
          nowIsoString: '2026-10-15T04:00:00Z',
        })
      ).toThrow(FabricatedScarcityError);
    });
  });
});
