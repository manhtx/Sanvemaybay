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
  const share = navigatorLike.share;
  if (typeof share === "function") {
    const res = share(target);
    if (res && typeof (res as Promise<void>).then === "function") {
      await res;
    }
    return "shared";
  }
  const cb = navigatorLike.clipboard;
  if (cb && typeof cb.writeText === "function") {
    const res = cb.writeText(target.url);
    if (res && typeof (res as Promise<void>).then === "function") {
      await res;
    }
    return "copied";
  }
  throw new Error("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.");
}
