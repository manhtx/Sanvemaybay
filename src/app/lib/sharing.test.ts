import { describe, expect, it, vi } from "vitest";
import { shareOrCopy, ShareTarget } from "./sharing";

const target: ShareTarget = {
  title: "HAN → BKK Deal",
  text: "Giá tốt bất thường",
  url: "https://farely.app/deals/han-bkk-123",
};

describe("shareOrCopy (FLY-UX-005, REQ-DOM-001, NC-025)", () => {
  it("prioritizes native Web Share API even when clipboard is also available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareOrCopy(target, { share, clipboard: { writeText } });
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith(target);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("passes complete intact target object to native share", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const complexTarget: ShareTarget = {
      title: "Chuyến bay Hà Nội đi Tokyo",
      text: "Giảm 42% so với trung bình",
      url: "https://farely.app/deals/han-nrt-456?ref=share",
    };

    await shareOrCopy(complexTarget, { share });
    expect(share).toHaveBeenCalledWith(complexTarget);
  });

  it("falls back to clipboard.writeText with target.url when share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareOrCopy(target, { clipboard: { writeText } });
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(target.url);
  });

  it("verifies clipboard.writeText receives ONLY target.url, not title or text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const detailedTarget: ShareTarget = {
      title: "Special Title",
      text: "Special Descriptive Text",
      url: "https://farely.app/deals/han-dmk-789",
    };

    await shareOrCopy(detailedTarget, { clipboard: { writeText } });
    expect(writeText).toHaveBeenCalledWith("https://farely.app/deals/han-dmk-789");
    expect(writeText).not.toHaveBeenCalledWith(expect.stringContaining("Special Title"));
    expect(writeText).not.toHaveBeenCalledWith(expect.stringContaining("Special Descriptive Text"));
  });

  it("throws explicit Vietnamese error when neither share nor clipboard is supported", async () => {
    await expect(shareOrCopy(target, {})).rejects.toThrow(
      "Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.",
    );
  });

  it("throws explicit Vietnamese error when clipboard exists but writeText is undefined", async () => {
    await expect(
      shareOrCopy(target, { clipboard: {} as unknown as { writeText: (v: string) => Promise<void> } }),
    ).rejects.toThrow("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.");
  });

  it("throws explicit Vietnamese error when share is not a function (e.g. boolean)", async () => {
    await expect(
      shareOrCopy(target, { share: true as unknown as (t: ShareTarget) => Promise<void> }),
    ).rejects.toThrow("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.");
  });

  it("propagates share promise rejection when user cancels or denies permission (AbortError)", async () => {
    const share = vi.fn().mockRejectedValue(new Error("AbortError: Share canceled"));
    await expect(shareOrCopy(target, { share })).rejects.toThrow("AbortError: Share canceled");
  });

  it("propagates clipboard promise rejection when permission is denied (NotAllowedError)", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError: Clipboard permission denied"));
    await expect(shareOrCopy(target, { clipboard: { writeText } })).rejects.toThrow(
      "NotAllowedError: Clipboard permission denied",
    );
  });

  it("propagates generic runtime exceptions during share execution", async () => {
    const share = vi.fn().mockRejectedValue(new TypeError("Failed to execute share"));
    await expect(shareOrCopy(target, { share })).rejects.toThrow(TypeError);
  });

  it("preserves pure immutability: Object.freeze on ShareTarget does not throw or mutate", async () => {
    const frozenTarget: ShareTarget = Object.freeze({
      title: "Frozen Title",
      text: "Frozen Description",
      url: "https://farely.app/deals/frozen-001",
    });

    const share = vi.fn().mockResolvedValue(undefined);
    const result = await shareOrCopy(frozenTarget, { share });
    expect(result).toBe("shared");
    expect(frozenTarget.title).toBe("Frozen Title");
  });

  it("supports diverse URL schemes and query parameters safely", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const complexUrlTarget: ShareTarget = {
      title: "Deal",
      text: "Text",
      url: "https://farely.app/deals/complex?origin=HAN&dest=BKK&utm_source=copy#matrix",
    };

    const result = await shareOrCopy(complexUrlTarget, { clipboard: { writeText } });
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(complexUrlTarget.url);
  });

  it("handles empty title and text strings gracefully when url is provided", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const minimalTarget: ShareTarget = {
      title: "",
      text: "",
      url: "https://farely.app/deals/minimal",
    };

    const result = await shareOrCopy(minimalTarget, { share });
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith(minimalTarget);
  });

  it("returns 'shared' when share resolves and ignores rejecting clipboard", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const rejectingWriteText = vi.fn().mockRejectedValue(new Error("Clipboard broken"));

    const result = await shareOrCopy(target, { share, clipboard: { writeText: rejectingWriteText } });
    expect(result).toBe("shared");
    expect(rejectingWriteText).not.toHaveBeenCalled();
  });

  it("handles long URLs with deep pathing and unicode parameters in clipboard fallback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const unicodeTarget: ShareTarget = {
      title: "Vé máy bay giá rẻ",
      text: "Khuyến mại đặc biệt",
      url: "https://farely.app/deals/search?city=H%C3%A0+N%E1%BB%99i&dest=Tokyo&depart=2026-11-20&fare_type=promo_verified",
    };

    const res = await shareOrCopy(unicodeTarget, { clipboard: { writeText } });
    expect(res).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(unicodeTarget.url);
  });

  it("throws explicit Vietnamese error when navigator-like object has empty or null properties", async () => {
    await expect(
      shareOrCopy(target, { share: undefined, clipboard: undefined }),
    ).rejects.toThrow("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.");
  });

  it("calls navigator.share with exact single argument containing title, text, and url", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    await shareOrCopy(target, { share });

    expect(share.mock.calls[0]).toHaveLength(1);
    expect(share.mock.calls[0][0]).toEqual(target);
  });

  it("differentiates return values ('shared' vs 'copied') deterministically", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const shareRes = await shareOrCopy(target, { share });
    const copyRes = await shareOrCopy(target, { clipboard: { writeText } });

    expect(shareRes).toBe("shared");
    expect(copyRes).toBe("copied");
    expect(shareRes).not.toBe(copyRes);
  });

  it("supports multi-request concurrent sharing operations without state corruption", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const operations = Array.from({ length: 50 }, (_, i) =>
      shareOrCopy({ ...target, url: `https://farely.app/deals/${i}` }, { share }),
    );

    const results = await Promise.all(operations);
    expect(results).toHaveLength(50);
    expect(results.every((r) => r === "shared")).toBe(true);
    expect(share).toHaveBeenCalledTimes(50);
  });

  it("performance benchmark: 10,000 share capability evaluations execute in < 50ms", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const navigatorShare = { share };
    const navigatorClip = { clipboard: { writeText } };

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      await shareOrCopy(target, navigatorShare);
      await shareOrCopy(target, navigatorClip);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
