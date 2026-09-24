import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { PublicClientError, reportClientIssue } from "../lib/clientDiagnostics";

export interface CreateAlertInput {
  destination: string;
  destination_code?: string;
  origin_code?: string;
  budget?: number;
  discount_threshold?: number;
  preferred_regions?: string[];
  date_from?: string;
  date_to?: string;
  frequency?: "instant" | "daily";
  notify_telegram: boolean;
  telegram_id?: string;
  notify_email: boolean;
  email: string;
  channel: string;
}

export async function createAlerts(alerts: CreateAlertInput[], turnstileToken: string) {
  if (!isSupabaseConfigured) {
    throw new PublicClientError("alert_service_unconfigured", "Dịch vụ cảnh báo chưa được cấu hình.");
  }
  const { data, error } = await supabase.functions.invoke("setup-alert", {
    body: { alerts, turnstile_token: turnstileToken },
  });
  if (error) {
    reportClientIssue("alert_create_transport_failed");
    throw new PublicClientError("alert_create_failed", "Không thể tạo cảnh báo lúc này. Vui lòng thử lại sau.");
  }
  if (!data?.success) {
    reportClientIssue("alert_create_rejected");
    throw new PublicClientError("alert_create_rejected", "Cảnh báo chưa được lưu. Vui lòng kiểm tra thông tin và thử lại.");
  }
  return data;
}

export async function manageAlert(
  action: "confirm" | "unsubscribe",
  parameters: { token?: string; alert_id?: string; signature?: string },
) {
  if (!isSupabaseConfigured) {
    throw new PublicClientError("alert_service_unconfigured", "Dịch vụ cảnh báo chưa được cấu hình.");
  }
  const { data, error } = await supabase.functions.invoke("manage-alert", {
    body: { action, ...parameters },
  });
  if (error || !data?.success) {
    reportClientIssue(error ? "alert_manage_transport_failed" : "alert_manage_rejected");
    throw new PublicClientError("alert_manage_failed", "Không thể xử lý liên kết cảnh báo lúc này.");
  }
  return data;
}
