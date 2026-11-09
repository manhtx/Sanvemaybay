import { describe, expect, it, vi } from "vitest";
import { shareOrCopy, ShareTarget } from "./sharing";

const target: ShareTarget = {
  title: "HAN → BKK Deal",
  text: "Giá tốt bất thường",
  url: "https://farely.app/deals/han-bkk-123",
};

describe("shareOrCopy (FLY-UX-005, REQ-DOM-001)", () => {
  it("prioritizes native Web Share API even when clipboard is also available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareOrCopy(target, { share, clipboard: { writeText } });
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith(target);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to clipboard.writeText with target.url when share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await shareOrCopy(target, { clipboard: { writeText } });
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(target.url);
  });

  it("throws explicit Vietnamese error when neither share nor clipboard is supported", async () => {
    await expect(shareOrCopy(target, {})).rejects.toThrow(
      "Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.",
    );

    await expect(shareOrCopy(target, { clipboard: {} as unknown as { writeText: (v: string) => Promise<void> } })).rejects.toThrow(
      "Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.",
    );
  });

  it("propagates share promise rejection when user cancels or denies permission", async () => {
    const share = vi.fn().mockRejectedValue(new Error("AbortError: Share canceled"));
    await expect(shareOrCopy(target, { share })).rejects.toThrow("AbortError: Share canceled");
  });

  it("propagates clipboard promise rejection when permission is denied", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError: Clipboard permission denied"));
    await expect(shareOrCopy(target, { clipboard: { writeText } })).rejects.toThrow(
      "NotAllowedError: Clipboard permission denied",
    );
  });
});
