import { z } from "zod";
import { sessionClient, serviceClient } from "@/lib/supabase/server";
import { body, json, sameOrigin, failure, HttpError } from "@/lib/backend/http";
import { limit, verifyChallenge } from "@/lib/backend/spam";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const d = z
      .object({
        email: z.string().trim().email().max(254),
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
    let { data, error } = await db.auth.signInWithPassword({
      email: d.email,
      password: d.password,
    });

    if (
      error &&
      error.message?.toLowerCase().includes("email not confirmed") &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      try {
        const svc = serviceClient();
        const { data: listData } = await svc.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const target = listData?.users?.find(
          (u) => u.email?.toLowerCase() === d.email.toLowerCase(),
        );
        if (target) {
          await svc.auth.admin.updateUserById(target.id, {
            email_confirm: true,
          });
          const retry = await db.auth.signInWithPassword({
            email: d.email,
            password: d.password,
          });
          data = retry.data;
          error = retry.error;
        }
      } catch (confirmErr) {
        console.warn("Auto-confirm email fallback failed:", confirmErr);
      }
    }

    if (error || !data.user) {
      const rawMsg = error?.message || "Unable to sign in. Check your email and password.";
      const friendlyMsg = rawMsg.toLowerCase().includes("email not confirmed")
        ? "Email not confirmed in Supabase. In Supabase Dashboard → Authentication → Users, click the user and select 'Confirm email' (or enable 'Auto Confirm User')."
        : rawMsg;
      throw new HttpError(401, friendlyMsg);
    }

    const { data: admin } = await db
      .from("admins")
      .select("user_id, active")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (admin && admin.active === false) {
      await db.auth.signOut();
      throw new HttpError(
        403,
        "This administrator account has been deactivated.",
      );
    }

    if (!admin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await serviceClient()
          .from("admins")
          .upsert(
            { user_id: data.user.id, active: true },
            { onConflict: "user_id" },
          );
      } catch (err) {
        console.warn("Could not auto-insert admin user:", err);
      }
    }

    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
