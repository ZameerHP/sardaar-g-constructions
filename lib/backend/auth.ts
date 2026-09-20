import "server-only";
import { sessionClient } from "@/lib/supabase/server";
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
  const { data: admin, error: adminError } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (adminError || !admin)
    throw new HttpError(403, "This account is not an approved administrator.");
  return { db, user };
}
