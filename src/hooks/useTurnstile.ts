import { useCallback, useEffect, useRef } from "react";

type TurnstileOptions = {
  sitekey: string;
  action: string;
  appearance: "interaction-only";
  execution: "execute";
  theme: "auto";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
};

type TurnstileApi = {
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  render: (element: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Security verification did not load."));
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Security verification did not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Security verification did not load.")), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export function useTurnstile(action: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const removeWidget = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
  }, []);

  useEffect(() => removeWidget, [removeWidget]);

  const prepare = useCallback(() => {
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY) void loadTurnstile();
  }, []);

  const verify = useCallback(async () => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!siteKey) throw new Error("Security verification is not configured.");
    if (!containerRef.current) throw new Error("Security verification is unavailable.");

    const turnstile = await loadTurnstile();
    removeWidget();

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        callback();
      };
      const rejectVerification = () => settle(() => reject(new Error("Security verification failed. Please try again.")));
      const timer = window.setTimeout(rejectVerification, 20_000);

      widgetIdRef.current = turnstile.render(containerRef.current!, {
        sitekey: siteKey,
        action,
        appearance: "interaction-only",
        execution: "execute",
        theme: "auto",
        callback: (token) => settle(() => resolve(token)),
        "error-callback": rejectVerification,
        "expired-callback": rejectVerification,
        "timeout-callback": rejectVerification,
      });
      turnstile.execute(widgetIdRef.current);
    });
  }, [action, removeWidget]);

  return { containerRef, prepare, removeWidget, verify };
}
