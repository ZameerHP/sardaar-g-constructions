import { serviceClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  body,
  json,
  failure,
  sameOrigin,
  dbError,
  HttpError,
} from "@/lib/backend/http";
import { verifyStoredFile, hash } from "@/lib/backend/storage";
import { emailPayloads, sendPendingEmails } from "@/lib/backend/email";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { id, secret } = z
      .object({ id: z.string().uuid(), secret: z.string().min(60).max(100) })
      .strict()
      .parse(await body(req));
    const db = serviceClient();
    const tokenHash = await hash(secret);
    const { data: q, error } = await db
      .from("quote_requests")
      .select("*,files:quote_files(*)")
      .eq("id", id)
      .eq("upload_token_hash", tokenHash)
      .maybeSingle();
    dbError(error);
    if (!q) throw new HttpError(404, "Submission not found.");
    if (q.ready)
      return json({
        message:
          "Your enquiry has been received. Our team will contact you soon.",
      });
    if (Date.now() - Date.parse(q.created_at) > 2 * 3600000)
      throw new HttpError(
        410,
        "Upload session expired. Please start a new enquiry.",
      );
    for (const f of q.files) {
      if (f.verified) continue;
      await verifyStoredFile("quote-files", f);
      const { error } = await db
        .from("quote_files")
        .update({ verified: true })
        .eq("id", f.id);
      dbError(error);
    }
    const payloads = emailPayloads(q, q.files);
    const { error: finalError } = await db.rpc("complete_quote", {
      p_id: id,
      p_token_hash: tokenHash,
      p_admin: payloads.admin,
      p_customer: payloads.customer,
    });
    dbError(finalError);
    // The enquiry and email jobs are durable before any provider call; cron retries failures.
    try {
      await sendPendingEmails();
    } catch {
      console.error("Email queue will retry");
    }
    return json(
      {
        message:
          "Your enquiry has been received. Our team will review it and contact you soon.",
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
