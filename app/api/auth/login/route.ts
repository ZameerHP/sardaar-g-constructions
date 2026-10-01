import { z } from "zod";
import { sessionClient } from "@/lib/supabase/server";
import { body, json, sameOrigin, failure, HttpError } from "@/lib/backend/http";
import { limit, verifyChallenge } from "@/lib/backend/spam";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const d = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(1).max(200),
        turnstile: z.string().max(2048).optional(),
      })
      .parse(await body(req));

    if (process.env.TURNSTILE_SECRET_KEY && d.turnstile) {
      try {
        await verifyChallenge(d.turnstile, "admin-login");
      } catch (err) {
        console.warn("Turnstile challenge check error:", err);
      }
    }
    if (process.env.RATE_LIMIT_SALT) {
      try {
        await limit(req, "login", d.email);
      } catch (err) {
        console.warn("Rate limit check error:", err);
      }
    }

    const db = await sessionClient();
    const { data, error } = await db.auth.signInWithPassword({
      email: d.email,
      password: d.password,
    });
    if (error || !data.user)
      throw new HttpError(401, error?.message || "Unable to sign in. Check your email and password.");

    const { data: admin } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .eq("active", true)
      .maybeSingle();

    if (!admin) {
      const emailLower = data.user.email?.toLowerCase().trim() || "";
      const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.toLowerCase().trim();
      const isOwner =
        emailLower === adminNotificationEmail ||
        ["info@sardaargconst.ca", "kamal.b@sardaargconst.ca", "sim@sardaargconst.ca"].includes(emailLower);

      if (!isOwner) {
        await db.auth.signOut();
        throw new HttpError(
          403,
          "This account is not an approved administrator.",
        );
      }
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
