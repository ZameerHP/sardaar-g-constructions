"use client";
import { useState } from "react";
import { Turnstile } from "@/app/turnstile";
export function LoginForm() {
  const [token, setToken] = useState("");
  const [reset, setReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const r = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: f.get("email"),
              turnstile: token,
            }),
          });
          const d: any = await r.json();
          if (!r.ok) throw new Error(d.error || "Verification failed.");
          location.assign("/admin");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unable to verify owner access.");
          setToken("");
          setReset((v) => v + 1);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Owner email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="e.g. info@sardaargconst.ca"
          required
        />
      </label>
      <Turnstile action="admin-login" onToken={setToken} resetKey={reset} />
      {error && (
        <p role="alert" className="form-message error">
          {error}
        </p>
      )}
      <button className="btn dark" disabled={busy || !token}>
        {busy ? "Verifying…" : "Verify & Enter Dashboard"}
      </button>
      <p className="form-note">
        Protected by Cloudflare verification. No password required for authorized owners.
      </p>
    </form>
  );
}
