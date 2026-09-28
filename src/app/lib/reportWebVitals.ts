const SAMPLE_KEY = "flycheap.rum-sampled";

export const CURRENT_CORE_WEB_VITALS = ["LCP", "INP", "CLS"] as const;
export const DIAGNOSTIC_WEB_VITALS = ["TTFB"] as const;
export const DEPRECATED_WEB_VITALS = ["FID"] as const;

export type CurrentCoreWebVital = typeof CURRENT_CORE_WEB_VITALS[number];

export function isCurrentCoreWebVital(metric: string): metric is CurrentCoreWebVital {
  return CURRENT_CORE_WEB_VITALS.includes(metric as CurrentCoreWebVital);
}

export function isDeprecatedWebVital(metric: string): boolean {
  return DEPRECATED_WEB_VITALS.includes(metric as (typeof DEPRECATED_WEB_VITALS)[number]);
}

export function shouldSampleWebVitals(
  sampleRate: number,
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.sessionStorage,
  random: () => number = Math.random,
): boolean {
  const boundedRate = Math.max(0, Math.min(1, Number.isFinite(sampleRate) ? sampleRate : 0));
  const existing = storage?.getItem(SAMPLE_KEY);
  if (existing === "yes") return true;
  if (existing === "no") return false;
  const sampled = random() < boundedRate;
  storage?.setItem(SAMPLE_KEY, sampled ? "yes" : "no");
  return sampled;
}

export function reportWebVitals() {
  if (typeof window === "undefined") return;
  const configuredRate = Number(import.meta.env.VITE_RUM_SAMPLE_RATE ?? 0.25);
  if (!shouldSampleWebVitals(configuredRate)) return;

  void import("web-vitals").then(({ onCLS, onINP, onLCP }) => {
    const report = (metric: { name: string; value: number; delta: number; rating: string; navigationType: string }) => {
      void import("./analytics").then(({ trackProductEvent }) => trackProductEvent({
          eventType: "web_vital",
          entityId: window.location.pathname.slice(0, 120),
          metadata: {
            metric: metric.name,
            value: Math.round(metric.value),
            delta: Math.round(metric.delta),
            rating: metric.rating,
            navigation_type: metric.navigationType,
          },
        })).catch(() => undefined);
    };
    onCLS(report);
    onINP(report);
    onLCP(report);
  }).catch(() => {
    // RUM is non-critical and must never interrupt the product experience.
  });
}
