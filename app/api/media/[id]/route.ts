import { publicClient, sessionClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/backend/validation";
import { json, failure } from "@/lib/backend/http";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    uuid.parse(id);
    let db = publicClient();
    let result = await db
      .from("media_assets")
      .select("storage_path")
      .eq("id", id)
      .eq("ready", true)
      .maybeSingle();
    if (!result.data) {
      db = await sessionClient();
      result = await db
        .from("media_assets")
        .select("storage_path")
        .eq("id", id)
        .eq("ready", true)
        .maybeSingle();
    }
    if (!result.data) return json({ error: "Image not found." }, 404);
    const { data, error } = await db.storage
      .from("site-media")
      .createSignedUrl(result.data.storage_path, 60);
    if (error || !data) return json({ error: "Image unavailable." }, 404);
    return new Response(null, {
      status: 302,
      headers: {
        Location: data.signedUrl,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
