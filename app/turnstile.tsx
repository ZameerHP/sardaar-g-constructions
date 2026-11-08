"use client";
import { useEffect } from "react";

export function Turnstile({
  action,
  onToken,
  resetKey = 0,
}: {
  action: string;
  onToken: (token: string) => void;
  resetKey?: number;
}) {
  useEffect(() => {
    // Do not render broken Cloudflare Turnstile widget when domain/sitekey is unverified
    onToken("");
  }, [action, resetKey, onToken]);
  return null;
}
