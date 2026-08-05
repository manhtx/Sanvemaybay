export interface ShareTarget {
  title: string;
  text: string;
  url: string;
}

export interface ShareNavigator {
  share?: (target: ShareTarget) => Promise<void>;
  clipboard?: { writeText: (value: string) => Promise<void> };
}

export async function shareOrCopy(target: ShareTarget, navigatorLike: ShareNavigator): Promise<"shared" | "copied"> {
  if (typeof navigatorLike.share === "function") {
    await navigatorLike.share(target);
    return "shared";
  }
  if (navigatorLike.clipboard?.writeText) {
    await navigatorLike.clipboard.writeText(target.url);
    return "copied";
  }
  throw new Error("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.");
}
