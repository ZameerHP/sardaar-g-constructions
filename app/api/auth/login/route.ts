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
        turnstile: z.string().min(1).max(2048),
      })
      .parse(await body(req));
    await verifyChallenge(d.turnstile, "admin-login");
    await limit(req, "login", d.email);
    const db = await sessionClient();
    const { data, error } = await db.auth.signInWithPassword({
      email: d.email,
      password: d.password,
    });
    if (error || !data.user)
      throw new HttpError(401, "Unable to sign in. Check your credentials.");
    const { data: admin } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .eq("active", true)
      .maybeSingle();
    if (!admin) {
      await db.auth.signOut();
      throw new HttpError(
        403,
        "This account is not an approved administrator.",
      );
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
