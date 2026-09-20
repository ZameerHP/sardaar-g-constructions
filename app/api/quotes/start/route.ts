import { serviceClient } from "@/lib/supabase/server";
import { quoteSchema } from "@/lib/backend/validation";
import {
  body,
  json,
  failure,
  sameOrigin,
  dbError,
  HttpError,
} from "@/lib/backend/http";
import { verifyChallenge, limit } from "@/lib/backend/spam";
import { hash, signedUploads, safeName } from "@/lib/backend/storage";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const d = quoteSchema.parse(await body(req));
    if (
      !process.env.RESEND_FROM_EMAIL ||
      !process.env.ADMIN_NOTIFICATION_EMAIL ||
      !process.env.RESEND_API_KEY
    )
      throw new HttpError(
        503,
        "Enquiries are temporarily unavailable. Please try again later.",
      );
    await verifyChallenge(d.turnstile, "quote");
    const db = serviceClient();
    const payloadHash = await hash(JSON.stringify({ ...d, turnstile: "" }));
    const { data: prior, error: lookup } = await db
      .from("quote_requests")
      .select("id,ready,payload_hash,created_at")
      .eq("idempotency_key", d.token)
      .maybeSingle();
    dbError(lookup);
    if (prior) {
      if (prior.payload_hash !== payloadHash)
        throw new HttpError(
          409,
          "A previous submission is pending. Retry without changing its details, or start a new enquiry.",
        );
      if (prior.ready)
        return json({
          saved: true,
          message: "Your enquiry has already been received.",
        });
      if (Date.now() - Date.parse(prior.created_at) > 2 * 3600000)
        throw new HttpError(
          410,
          "Upload session expired. Start a new enquiry.",
        );
      const { data: files, error } = await db
        .from("quote_files")
        .select("*")
        .eq("quote_id", prior.id)
        .order("position");
      dbError(error);
      return json({
        id: prior.id,
        secret: d.uploadSecret,
        uploads: await signedUploads("quote-files", files || []),
      });
    }
    await limit(req, "quote", d.email);
    const id = crypto.randomUUID();
    const secret = d.uploadSecret;
    const record = {
      id,
      idempotency_key: d.token,
      payload_hash: payloadHash,
      upload_token_hash: await hash(secret),
      name: d.name,
      company: d.company,
      phone: d.phone,
      email: d.email,
      project_location: d.location,
      project_type: d.type,
      project_size: d.size,
      required_start_date: d.startDate || null,
      start_timing: d.timing,
      scope: d.scope,
      message: d.message,
      reference: d.reference,
      source: d.source,
    };
    const { error } = await db.from("quote_requests").insert(record);
    dbError(error);
    const files = d.files.map((f, position) => ({
      position,
      id: crypto.randomUUID(),
      quote_id: id,
      storage_path: `${id}/${crypto.randomUUID()}`,
      filename: safeName(f.name),
      mime_type: f.type,
      size_bytes: f.size,
      category: f.category,
    }));
    if (files.length) {
      const { error } = await db.from("quote_files").insert(files);
      if (error) {
        await db.from("quote_requests").delete().eq("id", id);
        dbError(error);
      }
    }
    const uploads = await signedUploads("quote-files", files);
    return json({ id, secret, uploads }, 201);
  } catch (e) {
    return failure(e);
  }
}
