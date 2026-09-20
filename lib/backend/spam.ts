import "server-only";
import { serviceClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/supabase/config";
import { hash } from "./storage";
import { HttpError, dbError } from "./http";
export async function verifyChallenge(token: string, action: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret)
    throw new HttpError(
      503,
      "Enquiries are temporarily unavailable. Please try again later.",
    );
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
  const host = new URL(siteOrigin()).hostname;
  if (!r.ok || !d.success || d.action !== action || d.hostname !== host)
    throw new HttpError(400, "Please complete the security check again.");
}
export async function limit(req: Request, purpose: string, email = "") {
  const ip = process.env.VERCEL
    ? req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    : req.headers.get("cf-connecting-ip");
  const secret = process.env.RATE_LIMIT_SALT;
  if (!secret)
    throw new HttpError(503, "Enquiries are temporarily unavailable.");
  const db = serviceClient();
  for (const value of [
    ip || "unknown",
    ...(email ? [email.toLowerCase()] : []),
  ]) {
    const { data, error } = await db.rpc("take_rate_limit", {
      p_key: await hash(`${secret}:${purpose}:${value}`),
      p_limit: purpose === "quote" ? 5 : 20,
      p_seconds: 3600,
    });
    dbError(error);
    if (!data)
      throw new HttpError(429, "Too many requests. Please try again later.");
  }
}
