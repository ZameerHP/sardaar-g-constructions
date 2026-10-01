"use client";
import { useState } from "react";
import { Turnstile } from "@/app/turnstile";
export function LoginForm() {
  const [token, setToken] = useState("");
  const [reset, setReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(challengeToken: string) {
    if (!challengeToken || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstile: challengeToken }),
      });
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error || "Verification failed.");
      location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to verify owner access.");
      setToken("");
      setReset((v) => v + 1);
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleVerify(token);
      }}
    >
      <div style={{ marginBlock: "24px 16px" }}>
        <Turnstile
          action="admin-login"
          onToken={(t) => {
            setToken(t);
            handleVerify(t);
          }}
          resetKey={reset}
        />
      </div>
      {error && (
        <p role="alert" className="form-message error">
          {error}
        </p>
      )}
      <button className="btn dark" type="submit" disabled={busy || !token}>
        {busy ? "Verifying with Cloudflare…" : "Enter Owner Dashboard"}
      </button>
      <p className="form-note">
        Protected by Cloudflare verification. No email or password required.
      </p>
    </form>
  );
}
