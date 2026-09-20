# Sardaar G Construction Ltd.

Existing public website with a Supabase content-management backend, private project enquiries, Resend notifications and a separate owner dashboard. The public design, branding, pages and hero remain intact. Lenis handles desktop wheel scrolling; native touch scrolling and reduced-motion preferences remain supported.

Start with [BACKEND-SETUP.md](BACKEND-SETUP.md). The owner workflow is in [OWNER-GUIDE.md](OWNER-GUIDE.md), and release checks are in [TEST-CHECKLIST.md](TEST-CHECKLIST.md).

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill environment values from your own providers.
pnpm dev:vercel
```

```bash
pnpm typecheck
pnpm test:backend
pnpm build:vercel
pnpm start:vercel
```

Vercel uses `vercel.json` and the standard Next.js production build. The original `dev`, `build` and `start` scripts remain for the existing Sites/Vinext preview workflow. Application data no longer uses D1 or R2. Legacy `db/`, Drizzle and Sites build files are retained as project history/tooling, not the active database schema. Do not apply old D1 migrations to Supabase.

## Source map

| Deliverable | Location |
| --- | --- |
| Tables, indexes, RLS, private buckets, database functions | `supabase/migrations/202609200001_backend.sql` |
| Existing approved services and manufacturer seed | `supabase/seed.sql` |
| Owner login and content editors | `app/admin/` |
| Protected CRUD, uploads and private downloads | `app/api/admin/` |
| Quote sessions, verification and completion | `app/api/quotes/` |
| Email retries and storage cleanup | `app/api/cron/maintenance/route.ts` |
| Server validation, rate limits, email outbox | `lib/backend/` |
| Supabase server/browser clients and session refresh | `lib/supabase/`, `proxy.ts` |
| Published content mapping to the existing frontend | `lib/content.ts` |
| Existing visual design and motion | `app/site.tsx`, `app/hero.tsx`, `app/motion.tsx`, `app/globals.css` |
| Lenis and animated services | `app/smooth-scroll.tsx`, `ServiceList` in `app/site.tsx` |
| Environment names and deployment settings | `.env.example`, `vercel.json` |
| Executable validation and PostgreSQL policy tests | `tests/backend.test.ts` |

No credentials, customer data, dependencies or generated builds are included in the source handoff. Provider setup and a live integration test are required before using the new backend for real enquiries. The existing hosted public site is not automatically replaced by this handoff.
