import "server-only";
import { serviceClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/supabase/config";
import { dbError } from "./http";

export function emailSender() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Sardaar G Construction <onboarding@resend.dev>"
  );
}
export function emailRecipients() {
  return (process.env.ADMIN_NOTIFICATION_EMAIL || "info@sardaarg.ca")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Send one email through Resend. Throws on failure. */
export async function sendResend(payload: Record<string, unknown>, key?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });
  const d = (await r.json().catch(() => ({}))) as any;
  if (!r.ok)
    throw new Error(`Resend ${r.status}: ${d?.message || d?.name || "error"}`);
  return d as { id?: string };
}

function detailRows(q: any) {
  return [
    ["Name", q.name],
    ["Company", q.company],
    ["Phone", q.phone],
    ["Email", q.email],
    ["Location", q.project_location],
    ["Project type", q.project_type],
    ["Size", q.project_size],
    ["Start", q.required_start_date || q.start_timing],
    ["Scope", q.scope],
    ["Message", q.message],
    ["Reference", q.reference],
    ["Source", q.source === "contact" ? "Contact form" : "Quote form"],
  ] as [string, unknown][];
}

function adminHtml(q: any, fileLines: string[]) {
  const rows = detailRows(q)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 14px;border-bottom:1px solid #e6ebe3;color:#7a5c22;font:700 11px Arial;letter-spacing:.12em;text-transform:uppercase;width:130px;vertical-align:top">${esc(k)}</td><td style="padding:10px 14px;border-bottom:1px solid #e6ebe3;color:#1a2420;font:15px/1.5 Arial;white-space:pre-wrap">${esc(v || "Not supplied")}</td></tr>`,
    )
    .join("");
  const files = fileLines.length
    ? `<p style="font:700 12px Arial;color:#102a23;margin:22px 0 8px">Attached documents (admin sign-in required)</p><ul style="font:14px/1.6 Arial;color:#1a2420;padding-left:18px;margin:0">${fileLines.map((l) => `<li>${l}</li>`).join("")}</ul>`
    : "";
  return `<div style="background:#f3f5f0;padding:24px"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dfe5db;border-radius:16px;overflow:hidden"><div style="background:#102a23;padding:22px 26px"><div style="font:700 11px Arial;letter-spacing:.18em;color:#e4c787;text-transform:uppercase">New Website Enquiry</div><div style="font:700 22px Arial;color:#fff;margin-top:6px">${esc(q.name)} &middot; ${esc(q.project_type || "Project")}</div></div><div style="padding:8px 12px 24px"><table style="width:100%;border-collapse:collapse">${rows}</table>${files}<p style="margin:24px 14px 0"><a href="mailto:${esc(q.email)}" style="display:inline-block;background:#102a23;color:#e4c787;padding:12px 20px;border-radius:10px;font:700 13px Arial;text-decoration:none">Reply to ${esc(q.name)}</a></p></div></div></div>`;
}

function customerHtml(q: any) {
  return `<div style="background:#f3f5f0;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dfe5db;border-radius:16px;overflow:hidden"><div style="background:#102a23;padding:22px 26px"><div style="font:700 20px Arial;color:#fff">SARDAAR G <span style="color:#e4c787">CONSTRUCTION</span></div></div><div style="padding:26px;font:15px/1.65 Arial;color:#1a2420"><p>Hello ${esc(q.name)},</p><p>Thank you for contacting <strong>Sardaar G Construction Ltd.</strong> We have received your enquiry and our team will review your project details and get back to you within 24&ndash;48 hours.</p><p style="background:#f4f7f1;border:1px solid #e1e8dd;border-radius:10px;padding:12px 14px;font-size:13px;color:#4c5a50">Project: ${esc(q.project_type || "Exterior cladding")} &middot; ${esc(q.project_location || "British Columbia")}</p><p>Need to reach us sooner? Call <a href="tel:+17786811313" style="color:#102a23;font-weight:700">778-681-1313</a> or reply to this email.</p><p style="margin-top:26px;color:#6b7a70;font-size:13px">Sardaar G Construction Ltd.<br/>Exterior cladding &amp; siding &middot; British Columbia</p></div></div></div>`;
}

export function emailPayloads(q: any, files: any[]) {
  const from = emailSender();
  const to = emailRecipients();
  const fileLines = files.map(
    (f) =>
      `${esc(f.filename)}: <a href="${siteOrigin()}/api/admin/leads/${q.id}/files/${f.id}">${siteOrigin()}/api/admin/leads/${q.id}/files/${f.id}</a>`,
  );
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
      to,
      reply_to: q.email,
      subject: `New enquiry: ${q.name} — ${q.project_type || "Project"} (${q.project_location || "BC"})`,
      html: adminHtml(q, fileLines),
      text: `${details}\n\nDocuments (administrator sign-in required):\n${files.map((f) => `${f.filename}: ${siteOrigin()}/api/admin/leads/${q.id}/files/${f.id}`).join("\n") || "None"}`,
    },
    customer: {
      from,
      to: [q.email],
      reply_to: to[0],
      subject: "We received your enquiry — Sardaar G Construction",
      html: customerHtml(q),
      text: `Hello ${q.name},\n\nThank you for contacting Sardaar G Construction Ltd. We have received your enquiry and our team will contact you within 24-48 hours.\n\nCall 778-681-1313 if you need us sooner.\n\nSardaar G Construction Ltd.\nExterior cladding & siding · British Columbia`,
    },
  };
}

/** Send admin + customer emails immediately (no database required). */
export async function sendEnquiryEmailsDirect(q: any, files: any[] = []) {
  const p = emailPayloads(q, files);
  await sendResend(p.admin, `admin/${q.id}`);
  try {
    await sendResend(p.customer, `customer/${q.id}`);
  } catch (e) {
    // Customer auto-reply can fail on unverified Resend domains; the owner email already went out.
    console.warn("Customer confirmation email failed:", e instanceof Error ? e.message : e);
  }
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
