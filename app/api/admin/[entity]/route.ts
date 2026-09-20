import { requireAdmin } from "@/lib/backend/auth";
import {
  body,
  json,
  failure,
  sameOrigin,
  dbError,
  HttpError,
} from "@/lib/backend/http";
import {
  schemas,
  entities,
  type Entity,
  leadSchema,
  uuid,
} from "@/lib/backend/validation";
import { serviceClient } from "@/lib/supabase/server";
import { assertAssets } from "@/lib/backend/storage";
import { sendPendingEmails } from "@/lib/backend/email";
export const dynamic = "force-dynamic";
const pageSize = 25;
async function entityOf(params: Promise<{ entity: string }>) {
  const { entity } = await params;
  if (entity !== "leads" && !entities.includes(entity as Entity))
    throw new HttpError(404, "Not found.");
  return entity as Entity | "leads";
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  try {
    const { db } = await requireAdmin();
    const entity = await entityOf(params);
    const q = new URL(req.url).searchParams;
    const page = Math.max(0, Math.min(10000, Number(q.get("page")) || 0));
    let query: any = db
      .from(entity === "leads" ? "quote_requests" : entity)
      .select(
        entity === "projects"
          ? "*,images:project_images(*)"
          : entity === "leads"
            ? "*,files:quote_files(*),notifications:email_outbox(id,kind,status,last_error,sent_at)"
            : "*",
        { count: "exact" },
      );
    if (entity === "leads") {
      query = query.eq("ready", true).order("created_at", { ascending: false });
      const status = q.get("status");
      if (
        status &&
        ["New", "Contacted", "Quoted", "Won", "Lost"].includes(status)
      )
        query = query.eq("status", status);
    } else if (entity !== "contact_settings")
      query = query
        .order("display_order")
        .order("created_at", { ascending: false });
    const id = q.get("id");
    if (id && entity !== "contact_settings")
      query = query.eq("id", uuid.parse(id));
    const { data, error, count } = await query.range(
      page * pageSize,
      page * pageSize + pageSize - 1,
    );
    dbError(error);
    if (entity === "projects")
      for (const record of data || [])
        record.images?.sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order,
        );
    return json({ records: data, total: count, page, pageSize });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  try {
    sameOrigin(req);
    const { db } = await requireAdmin();
    const entity = await entityOf(params);
    const input = await body(req);
    if (entity === "leads") {
      if (input.action === "retry") {
        const id = uuid.parse(input.id);
        const service = serviceClient();
        const { error } = await service
          .from("email_outbox")
          .update({ next_attempt_at: new Date().toISOString(), attempts: 0 })
          .eq("quote_id", id)
          .eq("status", "failed");
        dbError(error);
        await sendPendingEmails();
        return json({ saved: true });
      }
      const d = leadSchema.parse(input);
      const { data, error } = await serviceClient()
        .from("quote_requests")
        .update({ status: d.status, internal_notes: d.internal_notes })
        .eq("id", d.id)
        .eq("ready", true)
        .select("id")
        .single();
      dbError(error);
      return json({ saved: true, id: data!.id });
    }
    const record: Record<string, any> = schemas[entity].parse(input);
    await assertAssets(record);
    if (entity === "projects") {
      const { error } = await db.rpc("save_project", { p: record });
      dbError(error);
    } else if (entity === "contact_settings") {
      const { error } = await db.from(entity).update(record).eq("id", 1);
      dbError(error);
    } else {
      const { error } = await db.from(entity).upsert(record);
      dbError(error);
    }
    return json({ saved: true, id: record.id });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  try {
    sameOrigin(req);
    const { db } = await requireAdmin();
    const entity = await entityOf(params);
    if (entity === "contact_settings")
      throw new HttpError(400, "Contact settings cannot be deleted.");
    const { id } = await body(req);
    uuid.parse(id);
    if (entity === "leads") {
      const service = serviceClient();
      const { data: files, error } = await service
        .from("quote_files")
        .select("storage_path")
        .eq("quote_id", id);
      dbError(error);
      if (files?.length) {
        const { error: storageError } = await service.storage
          .from("quote-files")
          .remove(files.map((f) => f.storage_path));
        dbError(storageError);
      }
      const { error: removeError } = await service
        .from("quote_requests")
        .delete()
        .eq("id", id);
      dbError(removeError);
    } else {
      const { error } = await db.from(entity).delete().eq("id", id);
      dbError(error);
    }
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
