export interface RouteMetadata {
  title: string;
  description: string;
  indexable: boolean;
}

const DEFAULT_METADATA: RouteMetadata = {
  title: "Farely — Nền tảng săn cơ hội vé máy bay",
  description: "Theo dõi giá vé máy bay, so sánh với lịch sử thị trường và nhận thông báo khi có mức giá tốt bất thường.",
  indexable: true,
};

const ROUTE_METADATA: Record<string, RouteMetadata> = {
  "/": DEFAULT_METADATA,
  "/deals": {
    title: "Cơ hội vé máy bay giá tốt | Farely",
    description: "Xem các mức giá vé máy bay đang giảm mạnh, xếp hạng theo mức tiết kiệm và độ tin cậy dữ liệu.",
    indexable: true,
  },
  "/historical-deals": {
    title: "Lịch sử biến động giá | Farely",
    description: "Tra cứu các quan sát giá trong quá khứ và trạng thái xác minh của từng tuyến bay.",
    indexable: true,
  },
  "/explore": {
    title: "Khám phá điểm đến | Farely",
    description: "Khám phá điểm đến và các tuyến bay đang được Farely theo dõi.",
    indexable: true,
  },
  "/search": {
    title: "Tìm vé máy bay thông minh | Farely",
    description: "Tìm mức giá được quan sát trên các tuyến bay hiện được hệ thống hỗ trợ.",
    indexable: true,
  },
  "/alerts": {
    title: "Cài báo giá tự động | Farely",
    description: "Đăng ký nhận cảnh báo khi tuyến bay bạn quan tâm xuất hiện mức giá đáng chú ý.",
    indexable: true,
  },
  "/saved": {
    title: "Deal đã lưu | Farely",
    description: "Xem lại các deal vé máy bay bạn đã lưu trên thiết bị này.",
    indexable: false,
  },
  "/advisor": {
    title: "Cố vấn hành trình | Farely",
    description: "Đánh giá phương án chuyến bay dựa trên giá, thời lượng, số điểm dừng và chi phí phát sinh.",
    indexable: true,
  },
  "/privacy": {
    title: "Chính sách quyền riêng tư | Farely",
    description: "Thông tin về dữ liệu Farely thu thập, mục đích sử dụng và quyền của người dùng.",
    indexable: true,
  },
  "/terms": {
    title: "Điều khoản sử dụng | Farely",
    description: "Điều khoản sử dụng và giới hạn trách nhiệm của Farely.",
    indexable: true,
  },
};

export function getRouteMetadata(pathname: string): RouteMetadata {
  if (/^\/deals\/[^/]+$/.test(pathname)) {
    return {
      title: "Chi tiết deal vé máy bay | Farely",
      description: "Chi tiết giá, mức tham chiếu, độ tin cậy và lịch sử quan sát của deal vé máy bay.",
      indexable: true,
    };
  }

  if (pathname === "/auth" || pathname.startsWith("/alerts/")) {
    return {
      title: "Tài khoản và cảnh báo | Farely",
      description: DEFAULT_METADATA.description,
      indexable: false,
    };
  }

  return ROUTE_METADATA[pathname] ?? {
    title: "Không tìm thấy trang | Farely",
    description: DEFAULT_METADATA.description,
    indexable: false,
  };
}
