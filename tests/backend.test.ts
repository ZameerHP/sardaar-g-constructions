import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { quoteSchema, schemas, sniffType } from "../lib/backend/validation";
import { sameOrigin, body, HttpError } from "../lib/backend/http";
const admin = "10000000-0000-4000-8000-000000000001";
const outsider = "10000000-0000-4000-8000-000000000002";
const asset = "20000000-0000-4000-8000-000000000001";
const project = "30000000-0000-4000-8000-000000000001";
const quote = "40000000-0000-4000-8000-000000000001";
const valid = {
  name: "Test Builder",
  email: "test@example.com",
  phone: "6045550100",
  location: "Surrey",
  type: "Commercial",
  scope: "Install fiber cement exterior panels.",
  consent: "yes",
  token: quote,
  turnstile: "test-token",
  uploadSecret: "x".repeat(72),
};
test("server validation rejects malformed dates, hidden keys, spam, oversized uploads and incomplete published content", () => {
  assert.equal(quoteSchema.safeParse(valid).success, true);
  for (const extra of [
    { startDate: "2026-99-99" },
    { startDate: "2026-02-30" },
    { consent: "no" },
    { website: "spam" },
    { role: "admin" },
    { files: [{ name: "plans.pdf", type: "application/pdf", size: 20971521 }] },
  ])
    assert.equal(quoteSchema.safeParse({ ...valid, ...extra }).success, false);
  assert.equal(
    schemas.projects.safeParse({
      id: project,
      title: "Test project",
      slug: "test-project",
      published: true,
    }).success,
    false,
  );
  assert.equal(
    schemas.manufacturers.safeParse({
      id: asset,
      brand_name: "Test",
      published: true,
      website: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    sniffType(new TextEncoder().encode("<script>alert(1)</script>")),
    null,
  );
  assert.equal(
    sniffType(new TextEncoder().encode("%PDF-1.7\n")),
    "application/pdf",
  );
  assert.equal(
    sniffType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
});
test("mutating HTTP requests reject foreign origins and oversized JSON", async () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  try {
    assert.throws(
      () =>
        sameOrigin(
          new Request("https://example.com/api", {
            headers: { origin: "https://attacker.example" },
          }),
        ),
      HttpError,
    );
    sameOrigin(
      new Request("https://example.com/api", {
        headers: { origin: "https://example.com" },
      }),
    );
    await assert.rejects(
      body(
        new Request("https://example.com/api", {
          method: "POST",
          body: "x".repeat(180001),
        }),
      ),
      HttpError,
    );
  } finally {
    if (previous) process.env.NEXT_PUBLIC_SITE_URL = previous;
    else delete process.env.NEXT_PUBLIC_SITE_URL;
  }
});
test("PostgreSQL migration, RLS, atomic project saves, private storage, quote completion and email queue", async () => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;grant select on storage.objects to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated,service_role;`);
  const sql = (
    await readFile("supabase/migrations/202609200001_backend.sql", "utf8")
  ).replace("create extension if not exists pgcrypto;", "");
  await db.exec(sql);
  await db.exec(`insert into auth.users values('${admin}'),('${outsider}');insert into public.admins(user_id) values('${admin}');
 insert into media_assets(id,storage_path,filename,mime_type,size_bytes,ready) values('${asset}','asset/test','test.webp','image/webp',100,true);
 insert into storage.objects(bucket_id,name) values('site-media','asset/test'),('quote-files','private/test');
 insert into quote_requests(id,idempotency_key,payload_hash,upload_token_hash,name,phone,email,project_location,project_type,scope) values('${quote}','${quote}','payload','secret','Builder','6045550100','test@example.com','Surrey','Commercial','Cladding');
 insert into quote_files(quote_id,storage_path,filename,mime_type,size_bytes) values('${quote}','private/test','plans.pdf','application/pdf',100);`);
  async function as(role: string, user = "") {
    await db.exec(
      `reset role;select set_config('request.jwt.claim.sub','${user}',false);set role ${role}`,
    );
  }
  async function count(table: string) {
    return Number(
      (await db.query<{ n: number }>(`select count(*)::int n from ${table}`))
        .rows[0].n,
    );
  }
  await as("anon");
  assert.equal(await count("projects"), 0);
  assert.equal(await count("media_assets"), 0);
  assert.equal(await count("storage.objects"), 0);
  await assert.rejects(db.query("select * from quote_requests"));
  await assert.rejects(
    db.query("insert into projects(title,slug) values('Bad','bad')"),
  );
  await as("authenticated", outsider);
  assert.equal(await count("admins"), 0);
  assert.equal(await count("quote_requests"), 0);
  await assert.rejects(
    db.query(`insert into admins(user_id) values('${outsider}')`),
  );
  await assert.rejects(
    db.query("insert into services(title,slug) values('Bad','bad')"),
  );
  await as("authenticated", admin);
  assert.equal(await count("admins"), 1);
  assert.equal(await count("quote_requests"), 1);
  assert.equal(await count("storage.objects"), 2);
  const p = schemas.projects.parse({
    id: project,
    title: "Verified project",
    slug: "verified-project",
    location: "Surrey",
    project_type: "Commercial",
    scope: "Cladding installation",
    featured_image_id: asset,
    featured_image_alt: "Cladding facade",
    published: true,
    images: [
      {
        id: crypto.randomUUID(),
        asset_id: asset,
        alt_text: "Detail",
        caption: "",
        display_order: 0,
      },
    ],
  });
  await db.query("select save_project($1::jsonb)", [JSON.stringify(p)]);
  await as("anon");
  assert.equal(await count("projects"), 1);
  assert.equal(await count("project_images"), 1);
  assert.equal(await count("media_assets"), 1);
  assert.equal(await count("storage.objects"), 1);
  await as("authenticated", admin);
  const bad = {
    ...p,
    title: "Must roll back",
    images: [{ ...p.images[0], asset_id: crypto.randomUUID() }],
  };
  await assert.rejects(
    db.query("select save_project($1::jsonb)", [JSON.stringify(bad)]),
  );
  assert.equal(
    (await db.query<{ title: string }>("select title from projects")).rows[0]
      .title,
    "Verified project",
  );
  assert.equal(await count("project_images"), 1);
  await db.exec("update projects set published=false");
  await as("anon");
  assert.equal(await count("projects"), 0);
  assert.equal(await count("project_images"), 0);
  assert.equal(await count("media_assets"), 0);
  assert.equal(await count("storage.objects"), 0);
  await assert.rejects(db.query("select take_rate_limit($1,1,60)", ["key"]));
  await as("service_role");
  assert.equal(
    (await db.query<{ ok: boolean }>("select take_rate_limit('key',1,60) ok"))
      .rows[0].ok,
    true,
  );
  assert.equal(
    (await db.query<{ ok: boolean }>("select take_rate_limit('key',1,60) ok"))
      .rows[0].ok,
    false,
  );
  await assert.rejects(
    db.query("select complete_quote($1,'secret','{}','{}')", [quote]),
  );
  await db.exec("update quote_files set verified=true");
  await assert.rejects(
    db.query("select complete_quote($1,'wrong','{}','{}')", [quote]),
  );
  await db.query("select complete_quote($1,'secret','{}','{}')", [quote]);
  await db.query("select complete_quote($1,'secret','{}','{}')", [quote]);
  assert.equal(await count("email_outbox"), 2);
  assert.equal(
    (await db.query("select * from claim_email_jobs(2)")).rows.length,
    2,
  );
  assert.equal(
    (await db.query("select * from claim_email_jobs(2)")).rows.length,
    0,
  );
  await db.exec(
    "update email_outbox set locked_until=now()-interval '1 minute'",
  );
  assert.equal(
    (await db.query("select * from claim_email_jobs(2)")).rows.length,
    2,
  );
  await db.exec(
    "update email_outbox set created_at=now()-interval '24 hours',status='failed'",
  );
  assert.equal(
    (await db.query("select * from claim_email_jobs(2)")).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query<{ n: number }>(
        "select count(*)::int n from email_outbox where status='review'",
      )
    ).rows[0].n,
    2,
  );
  await db.exec(`delete from quote_requests where id='${quote}'`);
  assert.equal(await count("quote_files"), 0);
  assert.equal(await count("email_outbox"), 0);
  assert.equal(await count("storage_deletions"), 1);
  await db.close();
});


test("JSON body limit cancels oversized chunked and multibyte requests", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new Uint8Array(100000)); },
    cancel() { cancelled = true; },
  });
  const req = new Request("https://example.com/api", {
    method: "POST", body: stream, duplex: "half",
  } as RequestInit & {duplex: "half"});
  await assert.rejects(body(req), (e: unknown) => e instanceof HttpError && e.status === 413);
  assert.equal(cancelled, true);
  await assert.rejects(body(new Request("https://example.com/api", {
    method: "POST", body: JSON.stringify({text: "é".repeat(100000)}),
  })), (e: unknown) => e instanceof HttpError && e.status === 413);
  assert.deepEqual(await body(new Request("https://example.com/api", {
    method: "POST", body: JSON.stringify({text: "Exterior — façade"}),
  })), {text: "Exterior — façade"});
});
