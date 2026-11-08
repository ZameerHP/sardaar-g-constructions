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
import { sendEnquiryEmailsDirect, emailPayloads, sendPendingEmails } from "@/lib/backend/email";

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const d = quoteSchema.parse(await body(req));
    await verifyChallenge(d.turnstile, "quote");
    await limit(req, "quote", d.email);

    const id = crypto.randomUUID();
    const secret = d.uploadSecret;
    const payloadHash = await hash(JSON.stringify({ ...d, turnstile: "" }));
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

    const hasServiceDb = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Fast path when no files are attached OR when Supabase service role key isn't set:
    // Save directly to database (if available) and send Resend email immediately.
    if (d.files.length === 0 || !hasServiceDb) {
      let savedViaRpc = false;
      if (hasServiceDb) {
        try {
          const db = serviceClient();
          const { data: prior } = await db
            .from("quote_requests")
            .select("id,ready")
            .eq("idempotency_key", d.token)
            .maybeSingle();
          if (prior?.ready) {
            return json({
              saved: true,
              message: "Your enquiry has already been received.",
            });
          }
          const { error: insErr } = await db
            .from("quote_requests")
            .insert({ ...record, ready: true });
          if (!insErr) {
            const payloads = emailPayloads(record, []);
            const { error: outboxErr } = await db.from("email_outbox").insert([
              { quote_id: id, kind: "admin", payload: payloads.admin },
              { quote_id: id, kind: "customer", payload: payloads.customer },
            ]);
            if (!outboxErr && process.env.RESEND_API_KEY) {
              await sendPendingEmails();
              savedViaRpc = true;
            }
          }
        } catch (dbErr) {
          console.warn("Direct DB save warning, falling back to direct email:", dbErr);
        }
      }

      if (!savedViaRpc && process.env.RESEND_API_KEY) {
        try {
          await sendEnquiryEmailsDirect(record, []);
        } catch (emailErr) {
          console.warn("Direct Resend delivery warning:", emailErr);
        }
      }

      return json({
        saved: true,
        message:
          "Thank you! Your enquiry has been received. Our team will review your project details and contact you within 24–48 hours.",
      });
    }

    // Multi-file upload flow with Supabase Storage
    const db = serviceClient();
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
