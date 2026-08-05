import { isValidDateOnly } from "./alert-matching.ts";

export function validateAlertInput(body: Record<string, unknown>): string | null {
  const email = body.email;
  const channel = body.channel;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ.";
  if (channel !== "email" && channel !== "telegram") return "Kênh thông báo không hợp lệ.";
  if (typeof body.destination !== "string" || !body.destination.trim()) return "Điểm đến không hợp lệ.";
  if (!/^[A-Z]{3}$/.test(String(body.origin_code ?? "")) || !/^[A-Z]{3}$/.test(String(body.destination_code ?? ""))) return "Mã sân bay không hợp lệ.";
  if (body.date_from != null && !isValidDateOnly(body.date_from)) return "Ngày đi từ không hợp lệ.";
  if (body.date_to != null && !isValidDateOnly(body.date_to)) return "Ngày đi đến không hợp lệ.";
  if (body.date_from && body.date_to && String(body.date_from) > String(body.date_to)) return "Khoảng ngày không hợp lệ.";
  if (channel === "telegram" && !/^-?\d+$/.test(String(body.telegram_id ?? ""))) return "Telegram Chat ID không hợp lệ.";
  const threshold = body.discount_threshold;
  if (threshold != null && (!Number.isFinite(Number(threshold)) || Number(threshold) < 0 || Number(threshold) > 100)) return "Ngưỡng giảm giá không hợp lệ.";
  const budget = body.budget;
  if (budget != null && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) return "Ngân sách không hợp lệ.";
  return null;
}
