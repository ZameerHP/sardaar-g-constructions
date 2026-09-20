# Backend setup and deployment

## 1. Create the Supabase database

Use a dedicated Supabase project. In SQL Editor, execute `supabase/migrations/202609200001_backend.sql` once. It creates all content tables, approved administrator records, quote/file relationships, indexes, RLS policies, database functions, a durable email outbox and storage cleanup queue. The migration is transactional and intended for a new schema; use a new versioned migration for subsequent changes.

Execute `supabase/seed.sql` to import the six existing service descriptions and seven manufacturer names. The seed preserves edited services if run again and creates no fictional projects, photos or reviews. Phone/email remain empty until the owner supplies them. The `site-media` and `quote-files` buckets must remain **private**. Do not add broad Storage write policies.

This is a replacement for the previous D1/R2 backend. Existing external database records/files are not automatically transferred; export any real legacy data before switching the production domain and map it into these tables. No live legacy data was imported during implementation.

## 2. Approve the owner account

In Supabase Authentication settings, disable public signups. Create the owner's email/password account in the Authentication dashboard, using a strong password and an appropriate confirmed-email workflow. Obtain its actual user UUID and run:

```sql
insert into public.admins(user_id, active)
values ('REPLACE-WITH-ACTUAL-AUTH-USER-UUID', true)
on conflict(user_id) do update set active=true;
```

There is no default password, public registration page, first-user-admin behavior or browser endpoint to approve users. Authenticated users without an active `admins` row cannot use the dashboard or admin APIs. To revoke access:

```sql
update public.admins set active=false
where user_id='REPLACE-WITH-ACTUAL-AUTH-USER-UUID';
```

Set the Supabase Auth Site URL to the actual production origin. Password resets/account invitations are managed through Supabase by the project administrator; this version intentionally provides email/password login and logout without a public account-management screen. Review Supabase session lifetime and account recovery settings before launch. The application checks `auth.getUser()` and active admin membership server-side on every protected operation.

## 3. Configure Resend and Turnstile

Verify the sending domain in Resend, including the DNS records shown by Resend. Create an API key with email-sending access. Use a verified sender in `RESEND_FROM_EMAIL` and the owner's inbox in `ADMIN_NOTIFICATION_EMAIL`.

Create a Cloudflare Turnstile widget for the exact production hostname, and a separate widget/allowed hostname for local or staging development. The server verifies token success, action (`quote` or `admin-login`) and hostname. Do not use a production hostname with a localhost `NEXT_PUBLIC_SITE_URL`; mismatches fail closed. The implementation does not bypass Turnstile in development.

## 4. Set environment variables in Vercel

Import the repository into Vercel, select Next.js, and use Node.js 22 or newer. `vercel.json` selects `pnpm build:vercel` and `.next` rather than the retained Worker build. Pin the same package manager as `package.json`. Add the values below under Project Settings → Environment Variables for each intended environment, then rebuild. Public values are compiled into the browser bundle.

| Variable | Exposure | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Exact canonical HTTPS origin, without a path |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Supabase publishable key; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Turnstile widget site key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Supabase service role key; never use a `NEXT_PUBLIC_` prefix |
| `TURNSTILE_SECRET_KEY` | Server secret | Matching widget secret |
| `RESEND_API_KEY` | Server secret | Resend sending key |
| `RESEND_FROM_EMAIL` | Server | `Sardaar G Construction <quotes@your-verified-domain>` |
| `ADMIN_NOTIFICATION_EMAIL` | Server | Owner notification inbox |
| `RATE_LIMIT_SALT` | Server secret | Independent random secret, at least 32 bytes |
| `CRON_SECRET` | Server secret | Independent random secret, at least 32 bytes |
| `SITE_INDEXABLE` | Server | `false` on staging; `true` on approved production |

Generate the two random secrets separately with `openssl rand -hex 32`. Enter secrets directly in provider settings, not in source control or public chat. For local Next.js development, put these variables in ignored `.env.local`. Each preview deployment must use its own exact origin and matching Turnstile hostname; an arbitrary Vercel preview hostname will not automatically pass origin checks.

The supplied maintenance schedule runs every five minutes. Select a Vercel plan that permits this cron frequency, or configure a trusted scheduler to GET `/api/cron/maintenance` with `Authorization: Bearer YOUR_CRON_SECRET` every five minutes. Remove/adjust the Vercel cron declaration if using another scheduler. Do not omit maintenance: it retries notifications and removes abandoned files. Verify the deployed cron actually runs.

## 5. Quote and upload workflow

1. The browser sends validated form metadata, a random idempotency UUID and a random upload secret to `/api/quotes/start` after Turnstile.
2. The server validates origin, fields, consent, honeypot, file manifest and rate limits. It saves a pending quote and scoped file records and returns immutable signed upload URLs.
3. File bytes upload **directly to private Supabase Storage**, avoiding the Vercel function body limit. Up to six PDFs/JPGs/PNGs/WebPs are accepted, 20 MB each and 60 MB total. Export CAD/office documents to PDF for this form.
4. `/api/quotes/finalize` verifies the secret, actual stored size and file signatures, then atomically marks the quote ready and creates both email jobs. It returns success after durable storage, even when Resend is temporarily unavailable.
5. Owner emails include full enquiry details and stable authenticated download links. Customer emails acknowledge receipt. Lead notes are never exposed in public responses or emails.

Uploads use unique object paths with overwrite disabled. The UI remembers completed uploads for retry while the page stays open. A resumed start request returns files in their original order. Upload sessions expire after two hours. Start a new enquiry if the session expires or a file must be replaced. Abandoned pending records and uploads are removed after five hours, beyond the maximum lifetime of issued upload URLs. Storage deletions also have a durable retry queue.

Private documents are delivered through approved-admin routes that mint short-lived signed download URLs (60 seconds). Email links require sign-in; they do not grant access by themselves. A URL already minted during authorized access remains valid until its short expiry. File-type/size validation is implemented; antivirus scanning is not included. Keep documents in private storage and apply the company's normal document scanning/handling process.

## 6. Email reliability and monitoring

Email payloads and idempotency keys are saved in `email_outbox`. Completion creates exactly one owner job and one customer job per quote. Workers claim jobs with database locking, use Resend idempotency keys, and retry failures with increasing delays. A crashed sender's lease expires for retry. Calls process two emails at a time to limit function duration.

Automatic retries stop after eight attempts or after the 23-hour retry window. Older unsent jobs become `review` to avoid sending duplicates beyond the provider's idempotency window. Inspect Resend delivery logs before manually sending a replacement. The dashboard shows delivery state and supports retrying recent failed jobs. A provider-accepted email is marked sent; actual inbox delivery/bounces must be monitored in Resend. No bounce webhook or email marketing subscription is included.

Monitor Vercel function errors and cron executions, Supabase storage/database usage, Auth sign-in events, and Resend delivery failures. Keep backups for both database and storage, and test restoring them; database backups alone are not copies of uploaded file bytes. Set an owner-approved lead retention policy. Spam deletion permanently removes the lead, notes, attachments and queued notifications.

## 7. Content and SEO

Only published records reach public content queries. A published project requires a location, project type, scope, featured photo and descriptive alt text; gallery images also need alt text. Referenced images cannot be deleted until removed from content. Admin image uploads are resized to a maximum 2,200px, encoded as WebP and stripped of source metadata by canvas conversion. Quote plans are preserved as originals for legibility.

Dynamic service/project/article routes emit editable titles, descriptions, canonical URLs, Open Graph data and appropriate structured metadata. The sitemap is generated dynamically from published content. Articles appear in the footer only once at least one post is published; the existing main navigation remains intact. Article content is plain text, escaped by React. No user-supplied HTML is executed. Use actual project locations and materials naturally in titles and descriptions for Surrey, Delta, Langley, Vancouver, Lower Mainland and BC; no fabricated location pages or keyword stuffing were added.

`SITE_INDEXABLE=false` prevents indexing of staging. Switch to true on the approved production deployment after the checklist passes. Supabase credentials unset: the public site retains its approved static reference content, while login/forms clearly indicate setup is required. Supabase configured but unavailable: dynamic content fails closed rather than republishing drafts or old fallback records.

## References

- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
