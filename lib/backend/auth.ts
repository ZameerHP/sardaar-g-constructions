import "server-only";
import { sessionClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { HttpError } from "./http";
import { cookies } from "next/headers";
import { hash } from "./storage";

const AUTHORIZED_EMAILS = [
  "info@sardaargconst.ca",
  "kamal.b@sardaargconst.ca",
  "sim@sardaargconst.ca",
];

export async function requireAdmin() {
  const cookieJar = await cookies();
  const ownerCookie = cookieJar.get("owner_session")?.value;

  let verifiedCookieEmail = "";
  if (ownerCookie && ownerCookie.includes(":")) {
    const [email, sig] = ownerCookie.split(":");
    const salt =
      process.env.RATE_LIMIT_SALT ||
      process.env.TURNSTILE_SECRET_KEY ||
      "sardaar-owner-secure";
    const expectedSig = await hash(`${salt}:owner:${email}`);
    if (sig === expectedSig) {
      verifiedCookieEmail = email.toLowerCase().trim();
    }
  }

  if (supabaseConfig()) {
    try {
      const db = await sessionClient();
      const {
        data: { user },
        error,
      } = await db.auth.getUser();

      if (user && !error) {
        const { data: admin, error: adminError } = await db
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (!adminError && admin) {
          return { db, user };
        }
      }
    } catch {
      // Continue to check verified cookie
    }
  }

  if (verifiedCookieEmail) {
    const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.toLowerCase().trim();
    const isAuthorized =
      AUTHORIZED_EMAILS.includes(verifiedCookieEmail) ||
      (adminNotificationEmail ? verifiedCookieEmail === adminNotificationEmail : false);

    if (isAuthorized) {
      const db = supabaseConfig() ? await sessionClient() : (null as any);
      return {
        db,
        user: { id: "owner", email: verifiedCookieEmail },
      };
    }
  }

  throw new HttpError(401, "Please sign in.");
}
