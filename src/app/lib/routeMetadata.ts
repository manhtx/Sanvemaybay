export interface RouteMetadata {
  title: string;
  description: string;
  indexable: boolean;
}

const DEFAULT_METADATA: RouteMetadata = {
  title: "FlyCheap AI — Theo dõi giá vé máy bay",
  description: "Theo dõi giá vé máy bay, so sánh với lịch sử và nhận cảnh báo khi xuất hiện mức giá đáng chú ý.",
  indexable: true,
};

const ROUTE_METADATA: Record<string, RouteMetadata> = {
  "/": DEFAULT_METADATA,
  "/deals": {
    title: "Deal vé máy bay được quan sát | FlyCheap AI",
    description: "Xem các mức giá vé máy bay nổi bật, được xếp hạng theo mức giảm và độ tin cậy của dữ liệu.",
    indexable: true,
  },
  "/historical-deals": {
    title: "Lịch sử deal vé máy bay | FlyCheap AI",
    description: "Tra cứu các quan sát giá trong quá khứ và trạng thái xác minh của từng deal.",
    indexable: true,
  },
  "/explore": {
    title: "Khám phá điểm đến | FlyCheap AI",
    description: "Khám phá điểm đến và các tuyến bay đang được FlyCheap AI theo dõi.",
    indexable: true,
  },
  "/search": {
    title: "Tìm vé máy bay | FlyCheap AI",
    description: "Tìm mức giá được quan sát trên các tuyến bay hiện được hệ thống hỗ trợ.",
    indexable: true,
  },
  "/alerts": {
    title: "Cài cảnh báo giá vé | FlyCheap AI",
    description: "Đăng ký nhận cảnh báo khi tuyến bay bạn quan tâm xuất hiện mức giá đáng chú ý.",
    indexable: true,
  },
  "/saved": {
    title: "Deal đã lưu | FlyCheap AI",
    description: "Xem lại các deal vé máy bay bạn đã lưu trên thiết bị này.",
    indexable: false,
  },
  "/advisor": {
    title: "Trợ lý lên kế hoạch chuyến đi | FlyCheap AI",
    description: "Đánh giá phương án chuyến bay dựa trên giá, thời lượng và các chi phí đã biết.",
    indexable: true,
  },
  "/privacy": {
    title: "Quyền riêng tư | FlyCheap AI",
    description: "Thông tin về dữ liệu FlyCheap AI thu thập, mục đích sử dụng và quyền của người dùng.",
    indexable: true,
  },
  "/terms": {
    title: "Điều khoản sử dụng | FlyCheap AI",
    description: "Điều khoản sử dụng và giới hạn trách nhiệm của FlyCheap AI.",
    indexable: true,
  },
};

export function getRouteMetadata(pathname: string): RouteMetadata {
  if (/^\/deals\/[^/]+$/.test(pathname)) {
    return {
      title: "Chi tiết deal vé máy bay | FlyCheap AI",
      description: "Chi tiết giá, mức tham chiếu, độ tin cậy và lịch sử quan sát của deal vé máy bay.",
      indexable: true,
    };
  }

  if (pathname === "/auth" || pathname.startsWith("/alerts/")) {
    return {
      title: "Tài khoản và cảnh báo | FlyCheap AI",
      description: DEFAULT_METADATA.description,
      indexable: false,
    };
  }

  return ROUTE_METADATA[pathname] ?? {
    title: "Không tìm thấy trang | FlyCheap AI",
    description: DEFAULT_METADATA.description,
    indexable: false,
  };
}
