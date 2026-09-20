import { requireAdmin } from "@/lib/backend/auth";
import { uuid } from "@/lib/backend/validation";
import { dbError, json, failure } from "@/lib/backend/http";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const { db } = await requireAdmin();
    const { id, fileId } = await params;
    uuid.parse(id);
    uuid.parse(fileId);
    const { data: file, error } = await db
      .from("quote_files")
      .select("*")
      .eq("id", fileId)
      .eq("quote_id", id)
      .eq("verified", true)
      .maybeSingle();
    dbError(error);
    if (!file) return json({ error: "File not found." }, 404);
    const { data, error: signError } = await db.storage
      .from("quote-files")
      .createSignedUrl(file.storage_path, 60, { download: file.filename });
    dbError(signError);
    return new Response(null, {
      status: 302,
      headers: {
        Location: data!.signedUrl,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
