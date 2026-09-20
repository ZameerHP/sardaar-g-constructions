# Test and release checklist

## Automated checks

Run `pnpm typecheck`, `pnpm test:backend`, and `pnpm build:vercel`.

The backend suite executes the migration in isolated PostgreSQL via PGlite with test Auth/Storage schemas and roles. It verifies:

- Invalid dates, unexpected fields, missing consent, honeypot input, unsafe URL schemes and oversized files are rejected.
- File signatures distinguish supported formats from arbitrary text.
- Foreign-origin mutations and oversized JSON are rejected.
- Anonymous visitors see published content only, and cannot read leads or write content.
- Unapproved authenticated users cannot grant themselves admin access or edit content.
- Approved admins can save a project and its gallery atomically; invalid gallery updates roll back the whole save.
- Unpublishing a project hides its project/gallery/media records and Storage access from anonymous visitors.
- Quote completion requires the correct secret and verified file records.
- Repeated completion produces exactly two email jobs, without duplicates.
- Rate limits, job leases, retry-window expiration and cascading quote deletion behave correctly.

PGlite tests exercise real PostgreSQL policy/function behavior, not a live Supabase Storage API, Auth server, Turnstile or Resend account.

## Provider-connected release gate

Complete on a staging project before production domain cutover. These need real provider configuration and were not completed in the credential-free workspace.

- [ ] Apply migration and seed to Supabase; confirm every public table has RLS and both buckets are private.
- [ ] Create approved and unapproved Auth users. Verify only the approved user can load `/admin`, call every admin endpoint, download files or publish content.
- [ ] Verify cookie refresh, logout, password reset through Supabase, session expiry and immediate admin revocation.
- [ ] Create/edit/unpublish/delete one record in every dashboard section. Confirm matching public data and private draft behavior.
- [ ] Upload/reorder/replace project images, choose featured and before/after photos, save alt text, test delete protection for referenced assets.
- [ ] Submit both quote and compact contact forms with real Turnstile. Verify validation and a clear success state.
- [ ] Submit six mixed PDF/JPG/PNG/WebP attachments within 60 MB, including one over 4.5 MB. Confirm direct Storage upload, verified database records and authenticated downloads.
- [ ] Interrupt/retry an upload, retry finalize, and retry after a lost start response. Check file order and duplicate prevention. Test an expired session and Start a new enquiry.
- [ ] Reject oversized manifests, false MIME types/signatures, wrong upload secrets, missing consent, foreign origins and invalid/expired/wrong-action Turnstile tokens.
- [ ] Verify owner and customer emails arrive from the verified sender; check owner file links after sign-in.
- [ ] Simulate Resend failure. Confirm the lead remains saved, cron retries, and no duplicate notification is sent after retry.
- [ ] Verify five-minute maintenance execution, pending upload cleanup after five hours and durable storage deletion retries.
- [ ] Review review/exhausted jobs in Resend before any manual resend. Check bounce/delivery logs.
- [ ] Inspect actual SEO metadata, canonical URLs, sitemap, structured data and Open Graph image fetches for all dynamic page types.
- [ ] Check 390px mobile and desktop navigation/forms/admin editors; keyboard access, focus, private file downloads and no horizontal overflow.
- [ ] Check hero scroll, service accordion, modal scroll locking and reduced motion on target browsers/devices.
- [ ] Confirm real company contact data, approved content, backup/restore and retention settings; enable production indexing only on the approved domain.

## Implementation verification

TypeScript and the standard Next.js/Vercel production build pass. The PostgreSQL/validation suite passes. The preserved homepage, Lenis initialization and service accordion transitions were inspected in the managed browser. The admin project editor and 390px dashboard layout were inspected using a temporary local UI fixture, which was removed before packaging; this did not bypass or exercise production authentication. No live provider account, production credentials or Vercel deployment was available; production Auth, uploads and email delivery are therefore awaiting the release gate above.
