import { requireAdmin } from "@/lib/backend/auth";
import { serviceClient } from "@/lib/supabase/server";
import {
  body,
  json,
  failure,
  sameOrigin,
  dbError,
  HttpError,
} from "@/lib/backend/http";
import { fileSchema, uuid } from "@/lib/backend/validation";
import {
  signedUploads,
  verifyStoredFile,
  safeName,
} from "@/lib/backend/storage";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { user } = await requireAdmin();
    const input = await body(req);
    const db = serviceClient();
    if (input.action === "complete") {
      const id = uuid.parse(input.id);
      const { data: asset, error } = await db
        .from("media_assets")
        .select("*")
        .eq("id", id)
        .single();
      dbError(error);
      await verifyStoredFile("site-media", asset);
      const { error: saveError } = await db
        .from("media_assets")
        .update({ ready: true })
        .eq("id", id);
      dbError(saveError);
      return json({ id, url: "/api/media/" + id });
    }
    const file = fileSchema.parse(input.file);
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)
      throw new HttpError(400, "Use a JPG, PNG or WebP image under 10 MB.");
    const id = crypto.randomUUID();
    const asset = {
      id,
      storage_path: `${id}/${crypto.randomUUID()}`,
      filename: safeName(file.name),
      size_bytes: file.size,
      mime_type: file.type,
      created_by: user.id,
    };
    const { error } = await db.from("media_assets").insert(asset);
    dbError(error);
    const [upload] = await signedUploads("site-media", [asset]);
    return json({ upload });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const { id } = await body(req);
    uuid.parse(id);
    const db = serviceClient();
    const { data: asset, error } = await db
      .from("media_assets")
      .select("storage_path")
      .eq("id", id)
      .single();
    dbError(error);
    // Foreign keys refuse deletion while any published or draft content still references this image.
    const { error: deleted } = await db
      .from("media_assets")
      .delete()
      .eq("id", id);
    dbError(deleted);
    const { error: removed } = await db.storage
      .from("site-media")
      .remove([asset!.storage_path]);
    dbError(removed);
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const page = Math.max(
      0,
      Math.min(10000, Number(new URL(req.url).searchParams.get("page")) || 0),
    );
    const { data, error, count } = await serviceClient()
      .from("media_assets")
      .select("*", { count: "exact" })
      .eq("ready", true)
      .order("created_at", { ascending: false })
      .range(page * 25, page * 25 + 24);
    dbError(error);
    return json({ records: data, total: count, page, pageSize: 25 });
  } catch (e) {
    return failure(e);
  }
}
