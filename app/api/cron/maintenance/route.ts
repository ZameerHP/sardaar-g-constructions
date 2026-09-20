import { serviceClient } from "@/lib/supabase/server";
import { sendPendingEmails } from "@/lib/backend/email";
import { json, failure, dbError } from "@/lib/backend/http";
export const maxDuration = 60;
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return json({ error: "Unauthorized" }, 401);
  try {
    await sendPendingEmails();
    const db = serviceClient();
    const cutoff = new Date(Date.now() - 5 * 3600000).toISOString();
    const { data: stale, error } = await db
      .from("quote_requests")
      .select("id,files:quote_files(storage_path)")
      .eq("ready", false)
      .lt("created_at", cutoff)
      .limit(5);
    dbError(error);
    for (const q of stale || []) {
      if (q.files.length) {
        const { error } = await db.storage
          .from("quote-files")
          .remove(q.files.map((f) => f.storage_path));
        dbError(error);
      }
      const { error } = await db
        .from("quote_requests")
        .delete()
        .eq("id", q.id)
        .eq("ready", false);
      dbError(error);
    }
    const { data: pending, error: assetError } = await db
      .from("media_assets")
      .select("id,storage_path")
      .eq("ready", false)
      .lt("created_at", cutoff)
      .limit(5);
    dbError(assetError);
    for (const a of pending || []) {
      const { error } = await db.storage
        .from("site-media")
        .remove([a.storage_path]);
      dbError(error);
      const { error: deleted } = await db
        .from("media_assets")
        .delete()
        .eq("id", a.id)
        .eq("ready", false);
      dbError(deleted);
    }
    const { error: rateError } = await db
      .from("rate_limits")
      .delete()
      .lt("expires_at", new Date().toISOString());
    dbError(rateError);
    const { data: deletions, error: queueError } = await db
      .from("storage_deletions")
      .select("*")
      .order("created_at")
      .limit(10);
    dbError(queueError);
    for (const item of deletions || []) {
      const { error } = await db.storage
        .from(item.bucket)
        .remove([item.storage_path]);
      dbError(error);
      const { error: deleted } = await db
        .from("storage_deletions")
        .delete()
        .eq("id", item.id);
      dbError(deleted);
    }
    return json({ ok: true, cleaned: stale?.length || 0 });
  } catch (e) {
    return failure(e);
  }
}
