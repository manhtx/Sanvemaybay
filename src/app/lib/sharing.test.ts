import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  shareOrCopy,
  buildPiiSafeShareUrl,
  formatSafeShareContent,
  checkShareRateLimit,
  resetShareRateLimitForTest,
} from "./sharing";

const target = { title: "HAN → BKK", text: "Deal", url: "https://flycheap.test/deals/1" };

describe("Sharing & Referrals (F45)", () => {
  beforeEach(() => {
    resetShareRateLimitForTest();
  });

  describe("shareOrCopy", () => {
    it("uses native share when available", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      await expect(shareOrCopy(target, { share })).resolves.toBe("shared");
      expect(share).toHaveBeenCalledWith(target);
    });

    it("falls back to clipboard and reports unsupported browsers", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      await expect(shareOrCopy(target, { clipboard: { writeText } })).resolves.toBe("copied");
      expect(writeText).toHaveBeenCalledWith(target.url);
      await expect(shareOrCopy(target, {})).rejects.toThrow("không hỗ trợ");
    });

    it("enforces abuse rate limiting after multiple rapid shares", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      for (let i = 0; i < 20; i++) {
        await expect(shareOrCopy(target, { share })).resolves.toBe("shared");
      }
      // 21st share in window should be rate-limited
      await expect(shareOrCopy(target, { share })).rejects.toThrow("Bạn đang chia sẻ quá nhanh");
    });
  });

  describe("buildPiiSafeShareUrl (F45 PII Invariant)", () => {
    it("strips sensitive tokens and session parameters", () => {
      const dangerousUrl =
        "https://farely.manhtx.com/deals/deal-123?token=secret123&session=sess99&email=victim%40example.com&watch_id=w456&access_token=jwt_xyz#auth=secret";

      const safeUrl = buildPiiSafeShareUrl(dangerousUrl, "deal-123");

      expect(safeUrl).not.toContain("token=");
      expect(safeUrl).not.toContain("secret123");
      expect(safeUrl).not.toContain("session=");
      expect(safeUrl).not.toContain("victim%40example.com");
      expect(safeUrl).not.toContain("watch_id=");
      expect(safeUrl).not.toContain("jwt_xyz");
      expect(safeUrl).not.toContain("#auth=");

      expect(safeUrl).toContain("ref=share");
      expect(safeUrl).toContain("utm_source=farely");
      expect(safeUrl).toContain("utm_medium=referral");
      expect(safeUrl).toContain("/deals/deal-123");
    });
  });

  describe("formatSafeShareContent (F45 Stale Deal Invariant)", () => {
    it("formats fresh deal without warning", () => {
      const freshDeal = {
        id: "fresh-1",
        from: "Hà Nội",
        to: "Bangkok",
        fromCode: "HAN",
        toCode: "BKK",
        price: 2_000_000,
        observedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        departDate: "2026-11-01",
      };

      const content = formatSafeShareContent(freshDeal, "https://farely.manhtx.com/deals/fresh-1");
      expect(content.title).toBe("HAN → BKK | Farely");
      expect(content.text).toContain("2.000.000");
      expect(content.text).not.toContain("Quan sát >24h trước");
    });

    it("appends explicit freshness disclosure for stale deal > 24h old", () => {
      const staleDeal = {
        id: "stale-1",
        from: "Hà Nội",
        to: "Bangkok",
        fromCode: "HAN",
        toCode: "BKK",
        price: 2_000_000,
        observedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36h ago
        departDate: "2026-11-01",
      };

      const content = formatSafeShareContent(staleDeal, "https://farely.manhtx.com/deals/stale-1");
      expect(content.text).toContain("Lưu ý: Quan sát >24h trước. Giá tại hãng có thể đã biến động");
    });
  });
});
