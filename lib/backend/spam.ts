import "server-only";
import { serviceClient } from "@/lib/supabase/server";
import { hash } from "./storage";
import { HttpError } from "./http";
export async function verifyChallenge(token: string | undefined, action: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // If no token or secret is present (e.g., Turnstile widget disabled or domain not linked), skip gracefully.
  if (!secret || !token) return;
  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const d = (await r.json()) as any;
    if (!r.ok || !d.success) {
      console.warn("Turnstile verification skipped due to widget/domain mismatch:", d);
      return;
    }
    if (d.action && d.action !== action)
      console.warn("Turnstile action mismatch", d.action, action);
  } catch (e) {
    // Cloudflare unreachable: don't block a genuine customer.
    console.warn("Turnstile verification unavailable:", e);
  }
}
export async function limit(req: Request, purpose: string, email = "") {
  const secret = process.env.RATE_LIMIT_SALT;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  let allowed = true;
  try {
    const db = serviceClient();
    for (const value of [ip, ...(email ? [email.toLowerCase()] : [])]) {
      const { data, error } = await db.rpc("take_rate_limit", {
        p_key: await hash(`${secret}:${purpose}:${value}`),
        p_limit: purpose === "quote" ? 8 : 20,
        p_seconds: 3600,
      });
      if (error) throw error;
      if (!data) allowed = false;
    }
  } catch (e) {
    console.warn("Rate limit check skipped:", e);
    return;
  }
  if (!allowed)
    throw new HttpError(429, "Too many requests. Please try again later.");
}
