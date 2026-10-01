import { sessionClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { sameOrigin, json, failure } from "@/lib/backend/http";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (supabaseConfig()) {
      try {
        const db = await sessionClient();
        await db.auth.signOut({ scope: "local" });
      } catch {
        // Ignore if local Supabase session was not active
      }
    }
    const cookieJar = await cookies();
    cookieJar.delete("owner_session");
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
