import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string) => void;
  resetSignal: number;
}

export function TurnstileWidget({ siteKey, onToken, resetSignal }: TurnstileWidgetProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: "setup_alert",
        theme: "dark",
        size: "flexible",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "timeout-callback": () => onToken(""),
        "error-callback": () => { onToken(""); setLoadFailed(true); },
      });
    };

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    script.addEventListener("error", () => setLoadFailed(true), { once: true });
    render();
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    };
  }, [onToken, siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken("");
    }
  }, [onToken, resetSignal]);

  return (
    <div aria-labelledby={`${reactId}-label`}>
      <p id={`${reactId}-label`} className="mb-2 text-xs font-semibold text-slate-400">Xác minh chống spam</p>
      <div ref={containerRef} className="min-h-[65px]" />
      {loadFailed && <p role="alert" className="mt-2 text-xs text-red-300">Không tải được bước xác minh. Kiểm tra kết nối và thử lại.</p>}
    </div>
  );
}
