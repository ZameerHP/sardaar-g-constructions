import { sessionClient } from "@/lib/supabase/server";
import { sameOrigin, json, failure } from "@/lib/backend/http";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const db = await sessionClient();
    await db.auth.signOut({ scope: "local" });
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
