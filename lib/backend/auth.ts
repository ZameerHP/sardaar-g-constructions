import "server-only";
import { sessionClient, serviceClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { HttpError } from "./http";

export async function requireAdmin() {
  if (!supabaseConfig())
    throw new HttpError(503, "Supabase setup is required.");
  const db = await sessionClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, "Please sign in.");

  const { data: admin } = await db
    .from("admins")
    .select("user_id, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (admin && admin.active === false) {
    throw new HttpError(403, "This administrator account has been deactivated.");
  }

  if (!admin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await serviceClient()
        .from("admins")
        .upsert({ user_id: user.id, active: true }, { onConflict: "user_id" });
    } catch (err) {
      console.warn("Could not auto-provision admin row:", err);
    }
  }

  return { db, user };
}
