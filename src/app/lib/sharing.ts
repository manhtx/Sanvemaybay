export interface ShareTarget {
  title: string;
  text: string;
  url: string;
}

export interface ShareNavigator {
  share?: (target: ShareTarget) => Promise<void>;
  clipboard?: { writeText: (value: string) => Promise<void> };
}

export function shareOrCopy(target: ShareTarget, navigatorLike: ShareNavigator): Promise<"shared" | "copied"> {
  const share = navigatorLike.share;
  if (typeof share === "function") {
    try {
      const res = share(target);
      if (res && typeof (res as Promise<void>).then === "function") {
        return (res as Promise<void>).then(() => "shared");
      }
      return Promise.resolve("shared");
    } catch (err) {
      return Promise.reject(err);
    }
  }
  const cb = navigatorLike.clipboard;
  if (cb && typeof cb.writeText === "function") {
    try {
      const res = cb.writeText(target.url);
      if (res && typeof (res as Promise<void>).then === "function") {
        return (res as Promise<void>).then(() => "copied");
      }
      return Promise.resolve("copied");
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return Promise.reject(new Error("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết."));
}
