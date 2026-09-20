import "server-only";
import { serviceClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/supabase/config";
import { dbError } from "./http";
export function emailPayloads(q: any, files: any[]) {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!from || !to)
    throw new Error("Email sender and recipient are not configured");
  const details = [
    ["Name", q.name],
    ["Company", q.company],
    ["Phone", q.phone],
    ["Email", q.email],
    ["Location", q.project_location],
    ["Project type", q.project_type],
    ["Size", q.project_size],
    ["Start date", q.required_start_date || q.start_timing],
    ["Scope", q.scope],
    ["Message", q.message],
    ["Reference", q.reference],
  ]
    .map(([k, v]) => `${k}: ${v || "Not supplied"}`)
    .join("\n\n");
  return {
    admin: {
      from,
      to: [to],
      reply_to: q.email,
      subject: "New project enquiry — Sardaar G Construction",
      text: `${details}\n\nPrivate documents (administrator sign-in required):\n${files.map((f) => `${f.filename}: ${siteOrigin()}/api/admin/leads/${q.id}/files/${f.id}`).join("\n") || "None"}\n\nManage enquiry: ${siteOrigin()}/admin?section=leads&id=${q.id}`,
    },
    customer: {
      from,
      to: [q.email],
      subject: "We received your enquiry — Sardaar G Construction",
      text: `Hello ${q.name},\n\nThank you for contacting Sardaar G Construction Ltd. We have received your enquiry and our team will review your project details and contact you soon.\n\nReference: ${q.id}\n\nSardaar G Construction Ltd.\nExterior cladding & siding · British Columbia\n${siteOrigin()}`,
    },
  };
}
export async function sendPendingEmails() {
  const db = serviceClient();
  if (!process.env.RESEND_API_KEY) return;
  const { data: jobs, error } = await db.rpc("claim_email_jobs", {
    p_limit: 2,
  });
  dbError(error);
  for (const job of jobs || []) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `quote/${job.id}`,
        },
        body: JSON.stringify(job.payload),
        signal: AbortSignal.timeout(12000),
      });
      const d = (await r.json()) as any;
      if (!r.ok) throw new Error("Resend returned " + r.status);
      const { error: save } = await db
        .from("email_outbox")
        .update({
          status: "sent",
          provider_id: d.id,
          sent_at: new Date().toISOString(),
          locked_until: null,
          last_error: null,
        })
        .eq("id", job.id);
      dbError(save);
    } catch (e) {
      const { error: save } = await db
        .from("email_outbox")
        .update({
          status: "failed",
          locked_until: null,
          last_error: e instanceof Error ? e.message : "Delivery failed",
          next_attempt_at: new Date(
            Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts),
          ).toISOString(),
        })
        .eq("id", job.id);
      dbError(save);
    }
  }
}
