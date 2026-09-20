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
              password: f.get("password"),
              turnstile: token,
            }),
          });
          const d: any = await r.json();
          if (!r.ok) throw new Error(d.error);
          location.assign("/admin");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unable to sign in.");
          setToken("");
          setReset((v) => v + 1);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
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
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="form-note">
        Access is by invitation. Contact the website administrator if you need
        your account approved or password reset.
      </p>
    </form>
  );
}
