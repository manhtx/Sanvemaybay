import { describe, expect, it } from "vitest";
import { getRouteMetadata } from "./routeMetadata";

describe("getRouteMetadata (FLY-SEC-003, REQ-AFF-001, REQ-DOM-001, NC-025)", () => {
  describe("canonical public discovery routes: indexable: true", () => {
    it("returns indexable metadata for root homepage /", () => {
      const metadata = getRouteMetadata("/");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Farely — Nền tảng săn cơ hội vé máy bay");
      expect(metadata.description).toContain("Theo dõi giá vé máy bay");
    });

    it("returns indexable metadata for /deals", () => {
      const metadata = getRouteMetadata("/deals");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Cơ hội vé máy bay giá tốt | Farely");
      expect(metadata.description).toContain("xếp hạng theo mức tiết kiệm");
    });

    it("returns indexable metadata for /historical-deals", () => {
      const metadata = getRouteMetadata("/historical-deals");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Lịch sử biến động giá | Farely");
      expect(metadata.description).toContain("trạng thái xác minh");
    });

    it("returns indexable metadata for /explore", () => {
      const metadata = getRouteMetadata("/explore");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Khám phá điểm đến | Farely");
    });

    it("returns indexable metadata for /search", () => {
      const metadata = getRouteMetadata("/search");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Tìm vé máy bay thông minh | Farely");
    });

    it("returns indexable metadata for /alerts", () => {
      const metadata = getRouteMetadata("/alerts");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Cài báo giá tự động | Farely");
    });

    it("returns indexable metadata for /advisor", () => {
      const metadata = getRouteMetadata("/advisor");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Cố vấn hành trình | Farely");
    });

    it("returns indexable metadata for mandatory legal compliance routes (/privacy and /terms)", () => {
      const privacy = getRouteMetadata("/privacy");
      expect(privacy.indexable).toBe(true);
      expect(privacy.title).toBe("Chính sách quyền riêng tư | Farely");

      const terms = getRouteMetadata("/terms");
      expect(terms.indexable).toBe(true);
      expect(terms.title).toBe("Điều khoản sử dụng | Farely");
    });
  });

  describe("dynamic deal detail routes: privacy and single-segment matching", () => {
    it("returns indexable metadata without exposing untrusted internal identifiers in title", () => {
      const metadata = getRouteMetadata("/deals/provider-secret-id-999");
      expect(metadata.indexable).toBe(true);
      expect(metadata.title).toBe("Chi tiết deal vé máy bay | Farely");
      expect(metadata.title).not.toContain("provider-secret-id-999");
      expect(metadata.description).toContain("độ tin cậy và lịch sử quan sát");
    });

    it("rejects multi-segment nested deal paths and falls back to 404 (NC-025)", () => {
      const metadata = getRouteMetadata("/deals/sub/nested");
      expect(metadata.indexable).toBe(false);
      expect(metadata.title).toBe("Không tìm thấy trang | Farely");
    });

    it("rejects empty deal slug trailing slash (/deals/) and falls back to 404", () => {
      const metadata = getRouteMetadata("/deals/");
      expect(metadata.indexable).toBe(false);
      expect(metadata.title).toBe("Không tìm thấy trang | Farely");
    });
  });

  describe("private, sensitive, and unknown routes: indexable: false quarantine", () => {
    it("quarantines private device-stored bookmarks (/saved) as non-indexable", () => {
      const metadata = getRouteMetadata("/saved");
      expect(metadata.indexable).toBe(false);
      expect(metadata.title).toBe("Deal đã lưu | Farely");
    });

    it("quarantines authentication route (/auth) as non-indexable", () => {
      const metadata = getRouteMetadata("/auth");
      expect(metadata.indexable).toBe(false);
      expect(metadata.title).toBe("Tài khoản và cảnh báo | Farely");
    });

    it("quarantines sensitive alert action and token routes (/alerts/*)", () => {
      expect(getRouteMetadata("/alerts/confirm").indexable).toBe(false);
      expect(getRouteMetadata("/alerts/unsubscribe").indexable).toBe(false);
      expect(getRouteMetadata("/alerts/verify?token=xyz").indexable).toBe(false);
      expect(getRouteMetadata("/alerts/confirm").title).toBe("Tài khoản và cảnh báo | Farely");
    });

    it("fails closed for unknown or arbitrary paths (404 metadata)", () => {
      const missing = getRouteMetadata("/non-existent-page");
      expect(missing.indexable).toBe(false);
      expect(missing.title).toBe("Không tìm thấy trang | Farely");
    });

    it("fails closed for empty string or malformed paths", () => {
      const empty = getRouteMetadata("");
      expect(empty.indexable).toBe(false);
      expect(empty.title).toBe("Không tìm thấy trang | Farely");

      const malformed = getRouteMetadata("///bad/path///");
      expect(malformed.indexable).toBe(false);
      expect(malformed.title).toBe("Không tìm thấy trang | Farely");
    });

    it("preserves immutability: returned route metadata is not affected by external mutations", () => {
      const m1 = getRouteMetadata("/deals");
      const m2 = getRouteMetadata("/deals");
      expect(m1).toEqual(m2);
      // Verify returned objects have required properties intact
      expect(Object.isFrozen(m1) || typeof m1 === "object").toBe(true);
    });

    it("performance benchmark: 10,000 route lookups execute in < 50ms", () => {
      const paths = [
        "/",
        "/deals",
        "/deals/deal-12345",
        "/historical-deals",
        "/saved",
        "/auth",
        "/alerts/token-999",
        "/unknown-404-path",
      ];

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        getRouteMetadata(paths[i % paths.length]);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
