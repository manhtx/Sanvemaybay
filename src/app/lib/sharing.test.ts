import { describe, expect, it, vi } from "vitest";
import { shareOrCopy } from "./sharing";

const target = { title: "HAN → BKK", text: "Deal", url: "https://flycheap.test/deals/1" };

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
});
