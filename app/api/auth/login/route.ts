import { z } from "zod";
import { sessionClient, serviceClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { body, json, sameOrigin, failure, HttpError } from "@/lib/backend/http";
import { limit, verifyChallenge } from "@/lib/backend/spam";
import { cookies } from "next/headers";
import { hash } from "@/lib/backend/storage";

const AUTHORIZED_EMAILS = [
  "info@sardaargconst.ca",
  "kamal.b@sardaargconst.ca",
  "sim@sardaargconst.ca",
];

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const d = z
      .object({
        email: z.string().email().max(254).optional(),
        turnstile: z.string().min(1).max(2048),
      })
      .parse(await body(req));

    // Verify Cloudflare Turnstile server-side with TURNSTILE_SECRET_KEY
    await verifyChallenge(d.turnstile, "admin-login");

    const defaultOwnerEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL?.toLowerCase().trim() ||
      "info@sardaargconst.ca";
    const emailNorm = (d.email || defaultOwnerEmail).toLowerCase().trim();
    await limit(req, "login", emailNorm);
    const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.toLowerCase().trim();

    let isAuthorized =
      AUTHORIZED_EMAILS.includes(emailNorm) ||
      (adminNotificationEmail ? emailNorm === adminNotificationEmail : false);

    const hasSupabase = Boolean(supabaseConfig());

    if (!isAuthorized && hasSupabase) {
      try {
        const sClient = serviceClient();
        const { data: adminRows } = await sClient
          .from("admins")
          .select("user_id")
          .eq("active", true);

        if (adminRows && adminRows.length > 0) {
          const {
            data: { users },
          } = await sClient.auth.admin.listUsers();
          const adminUserIds = new Set(adminRows.map((r: any) => r.user_id));
          const matchingAdmin = users?.find(
            (u) => adminUserIds.has(u.id) && u.email?.toLowerCase().trim() === emailNorm,
          );
          if (matchingAdmin) {
            isAuthorized = true;
          }
        }
      } catch (err) {
        console.error("Admin verification check error:", err);
      }
    }

    if (!isAuthorized) {
      throw new HttpError(403, "This email is not an authorized administrator.");
    }

    // If Supabase is configured, create/sync user and establish session
    if (hasSupabase) {
      try {
        const sClient = serviceClient();
        const {
          data: { users },
        } = await sClient.auth.admin.listUsers();
        let user = users?.find((u) => u.email?.toLowerCase().trim() === emailNorm);
        if (!user) {
          const { data: newUser, error: createError } = await sClient.auth.admin.createUser({
            email: emailNorm,
            email_confirm: true,
          });
          if (!createError && newUser?.user) {
            user = newUser.user;
          }
        }

        if (user) {
          await sClient.from("admins").upsert(
            { user_id: user.id, active: true },
            { onConflict: "user_id" },
          );

          const { data: linkData, error: linkError } = await sClient.auth.admin.generateLink({
            type: "magiclink",
            email: emailNorm,
          });

          if (!linkError && linkData?.properties?.hashed_token) {
            const sessionDb = await sessionClient();
            await sessionDb.auth.verifyOtp({
              token_hash: linkData.properties.hashed_token,
              type: "magiclink",
            });
          }
        }
      } catch (e) {
        console.error("Supabase owner session sync error:", e);
      }
    }

    // Set signed HTTP-only owner cookie for verified owner access
    const salt =
      process.env.RATE_LIMIT_SALT ||
      process.env.TURNSTILE_SECRET_KEY ||
      "sardaar-owner-secure";
    const sig = await hash(`${salt}:owner:${emailNorm}`);
    const cookieJar = await cookies();
    cookieJar.set("owner_session", `${emailNorm}:${sig}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
