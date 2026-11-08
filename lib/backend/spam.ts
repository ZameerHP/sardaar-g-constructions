import "server-only";
import { serviceClient } from "@/lib/supabase/server";
import { hash } from "./storage";
import { HttpError } from "./http";
export async function verifyChallenge(token: string | undefined, action: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Security check is optional: if Turnstile isn't configured, skip it.
  if (!secret) return;
  if (!token) {
    // Only demand a token when the visible widget is actually configured.
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
      throw new HttpError(400, "Please complete the security check.");
    return;
  }
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
    if (!r.ok || !d.success)
      throw new HttpError(400, "Please complete the security check again.");
    if (d.action && d.action !== action)
      console.warn("Turnstile action mismatch", d.action, action);
  } catch (e) {
    if (e instanceof HttpError) throw e;
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
