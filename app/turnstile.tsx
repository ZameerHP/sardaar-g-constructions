"use client";
import { useEffect, useRef } from "react";
type TurnstileAPI = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}
let loading: Promise<void> | null = null;
function load() {
  if (window.turnstile) return Promise.resolve();
  if (!loading)
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error("Security check could not load."));
      };
      document.head.appendChild(script);
    });
  return loading;
}
export function Turnstile({
  action,
  onToken,
  resetKey = 0,
}: {
  action: string;
  onToken: (token: string) => void;
  resetKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    let cancelled = false;
    let id: string | undefined;
    if (!sitekey) return;
    load()
      .then(() => {
        if (cancelled || !ref.current) return;
        id = window.turnstile!.render(ref.current, {
          sitekey,
          action,
          "response-field": false,
          theme: "light",
          size: "flexible",
          callback: (v: string) => callback.current(v),
          "expired-callback": () => callback.current(""),
          "error-callback": () => callback.current(""),
        });
      })
      .catch(() => callback.current(""));
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [action, sitekey, resetKey]);
  return (
    <div className="field wide">
      <div ref={ref} />
      {!sitekey && (
        <p className="form-note">
          Online enquiries will be available once the security check is
          configured.
        </p>
      )}
    </div>
  );
}
