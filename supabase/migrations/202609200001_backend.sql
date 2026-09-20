-- Apply once to a Supabase project. No shared/default administrator is created.
begin;
create extension if not exists pgcrypto;
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade, active boolean not null default true, created_at timestamptz not null default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admins where user_id=(select auth.uid()) and active)$$;
revoke all on function public.is_admin() from public; grant execute on function public.is_admin() to anon,authenticated,service_role;
create table public.media_assets (id uuid primary key default gen_random_uuid(), storage_path text not null unique, filename text not null, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')), size_bytes bigint not null check(size_bytes between 1 and 10485760), ready boolean not null default false, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now());
create table public.projects (
 id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),location text not null default '',project_type text not null default '',scope text not null default '',materials text not null default '',status text not null default 'Completed' check(status in ('Completed','Ongoing')),featured boolean not null default false,published boolean not null default false,display_order integer not null default 0,
 featured_image_id uuid references public.media_assets(id),featured_image_alt text not null default '',before_image_alt text not null default '',after_image_alt text not null default '',before_image_id uuid references public.media_assets(id),after_image_id uuid references public.media_assets(id),og_image_id uuid references public.media_assets(id),seo_title text not null default '',seo_description text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(not published or (location<>'' and project_type<>'' and scope<>'' and featured_image_id is not null and featured_image_alt<>''))
);
create table public.project_images(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.projects(id) on delete cascade,asset_id uuid not null references public.media_assets(id),alt_text text not null default '',caption text not null default '',display_order integer not null default 0,created_at timestamptz not null default now(),unique(project_id,asset_id));
create index project_images_project_order on public.project_images(project_id,display_order);
create index project_images_asset on public.project_images(asset_id);
create table public.services (id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),summary text not null default '',description text not null default '',bullet_points jsonb not null default '[]' check(jsonb_typeof(bullet_points)='array'),image_id uuid references public.media_assets(id),image_alt text not null default '',fallback_image text not null default 'seattle-facade',seo_title text not null default '',seo_description text not null default '',og_image_id uuid references public.media_assets(id),published boolean not null default false,display_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.testimonials (id uuid primary key default gen_random_uuid(),client_name text not null,company text not null default '',review text not null,rating integer check(rating between 1 and 5),project_type text not null default '',published boolean not null default false,display_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.manufacturers (id uuid primary key default gen_random_uuid(),brand_name text not null,logo_id uuid references public.media_assets(id),logo_alt text not null default '',website text not null default '',display_order integer not null default 0,published boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.contact_settings(id smallint primary key default 1 check(id=1),phone text not null default '',email text not null default '',instagram text not null default 'https://www.instagram.com/sardaarg_ltd/',service_area text not null default 'British Columbia, Canada',address text not null default '',maps_embed_url text not null default '',updated_at timestamptz not null default now());
insert into public.contact_settings(id) values(1);
create table public.blog_posts (id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),featured_image_id uuid references public.media_assets(id),image_alt text not null default '',excerpt text not null default '',content text not null default '',seo_title text not null default '',seo_description text not null default '',og_image_id uuid references public.media_assets(id),published boolean not null default false,display_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(not published or content<>''));
create table public.quote_requests(id uuid primary key default gen_random_uuid(),idempotency_key uuid not null unique,payload_hash text not null,upload_token_hash text not null,name text not null,company text not null default '',phone text not null,email text not null,project_location text not null,project_type text not null,project_size text not null default '',required_start_date date,start_timing text not null default '',scope text not null,message text not null default '',reference text not null default '',source text not null default 'quote' check(source in ('quote','contact')),consent_at timestamptz not null default now(),status text not null default 'New' check(status in ('New','Contacted','Quoted','Won','Lost')),internal_notes text not null default '',ready boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index quote_requests_created on public.quote_requests(created_at desc) where ready;
create index quote_requests_status on public.quote_requests(status,created_at desc) where ready;
create table public.quote_files(id uuid primary key default gen_random_uuid(),quote_id uuid not null references public.quote_requests(id) on delete cascade,storage_path text not null unique,filename text not null,mime_type text not null check(mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),size_bytes bigint not null check(size_bytes between 1 and 20971520),position integer not null default 0,category text not null default 'document' check(category in ('drawing','document','photo')),verified boolean not null default false,created_at timestamptz not null default now());
create index quote_files_quote on public.quote_files(quote_id);
create table public.rate_limits(key text primary key,hits integer not null default 1,expires_at timestamptz not null);
create table public.email_outbox(id uuid primary key default gen_random_uuid(),quote_id uuid not null references public.quote_requests(id) on delete cascade,kind text not null check(kind in ('admin','customer')),payload jsonb not null,status text not null default 'pending' check(status in ('pending','sending','sent','failed','review')),attempts integer not null default 0,provider_id text,last_error text,locked_until timestamptz,next_attempt_at timestamptz not null default now(),created_at timestamptz not null default now(),sent_at timestamptz,unique(quote_id,kind));
create index email_jobs_pending on public.email_outbox(next_attempt_at) where status in ('pending','failed','sending');
create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end$$;
do $$declare t text;begin foreach t in array array['projects','services','testimonials','manufacturers','blog_posts','contact_settings','quote_requests'] loop execute format('create trigger touch_updated before update on public.%I for each row execute function public.touch_updated_at()',t);end loop;end$$;
-- Every exposed table has RLS. Non-admin authenticated users gain no write privileges.
alter table public.admins enable row level security;
create policy own_admin_status on public.admins for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.admins from anon,authenticated;grant select on public.admins to authenticated;
do $$declare t text;begin foreach t in array array['projects','services','testimonials','manufacturers','blog_posts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy public_published on public.%I for select to anon,authenticated using(published or (select public.is_admin()))',t);
 execute format('create policy admin_write on public.%I for all to authenticated using((select public.is_admin())) with check((select public.is_admin()))',t);
 execute format('grant select on public.%I to anon; grant select,insert,update,delete on public.%I to authenticated',t,t);
 execute format('create index %I on public.%I(display_order,created_at desc) where published',t||'_public_order',t);
end loop;end$$;
alter table public.project_images enable row level security;
create policy public_project_images on public.project_images for select to anon,authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.published) or (select public.is_admin()));
create policy admin_project_images on public.project_images for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
grant select on public.project_images to anon;grant select,insert,update,delete on public.project_images to authenticated;
alter table public.contact_settings enable row level security;
create policy public_contact on public.contact_settings for select to anon,authenticated using(true);
create policy admin_contact on public.contact_settings for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
grant select on public.contact_settings to anon,authenticated;grant update on public.contact_settings to authenticated;
do $$declare t text;begin foreach t in array array['quote_requests','quote_files','media_assets','email_outbox','rate_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 if t<>'rate_limits' then execute format('create policy admin_read on public.%I for select to authenticated using((select public.is_admin()))',t);execute format('grant select on public.%I to authenticated',t);end if;
end loop;end$$;
-- Mutations for leads, files and emails go through authenticated server APIs.
-- Service credentials are only used after authorization, except challenge-validated quote creation.
grant all on all tables in schema public to service_role;
create function public.can_read_asset(asset uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.media_assets a where a.id=asset and a.ready and (
 exists(select 1 from public.projects p where p.published and asset in(p.featured_image_id,p.before_image_id,p.after_image_id,p.og_image_id)) or
 exists(select 1 from public.project_images i join public.projects p on p.id=i.project_id where p.published and i.asset_id=asset) or
 exists(select 1 from public.services s where s.published and asset in(s.image_id,s.og_image_id)) or
 exists(select 1 from public.manufacturers m where m.published and m.logo_id=asset) or
 exists(select 1 from public.blog_posts b where b.published and asset in(b.featured_image_id,b.og_image_id))))
$$;
revoke all on function public.can_read_asset(uuid) from public;grant execute on function public.can_read_asset(uuid) to anon,authenticated,service_role;
create policy published_assets on public.media_assets for select to anon,authenticated using(public.can_read_asset(id));
grant select on public.media_assets to anon;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('site-media','site-media',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('quote-files','quote-files',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
-- Public access is limited to assets referenced by published content; drafts stay private.
create policy read_published_site_images on storage.objects for select to anon,authenticated using(bucket_id='site-media' and exists(select 1 from public.media_assets a where a.storage_path=name and public.can_read_asset(a.id)));
create policy admin_storage_read on storage.objects for select to authenticated using(bucket_id in('site-media','quote-files') and (select public.is_admin()));
-- No public INSERT/UPDATE policy: upload URLs are scoped to server-generated immutable paths.
create function public.take_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$declare n integer;begin insert into public.rate_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds)) on conflict(key) do update set hits=case when public.rate_limits.expires_at<now() then 1 else public.rate_limits.hits+1 end,expires_at=case when public.rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else public.rate_limits.expires_at end returning hits into n;return n<=p_limit;end$$;
revoke all on function public.take_rate_limit(text,integer,integer) from public,anon,authenticated;grant execute on function public.take_rate_limit(text,integer,integer) to service_role;
-- A project and all its gallery references save atomically under the caller's admin RLS.
create function public.save_project(p jsonb) returns uuid language plpgsql security invoker set search_path='' as $$declare pid uuid=(p->>'id')::uuid;begin
 if not public.is_admin() then raise exception 'Administrator required' using errcode='42501';end if;
 insert into public.projects(id,title,slug,location,project_type,scope,materials,status,featured,published,display_order,featured_image_id,featured_image_alt,before_image_alt,after_image_alt,before_image_id,after_image_id,og_image_id,seo_title,seo_description)
 values(pid,p->>'title',p->>'slug',p->>'location',p->>'project_type',p->>'scope',p->>'materials',p->>'status',(p->>'featured')::boolean,(p->>'published')::boolean,(p->>'display_order')::integer,(p->>'featured_image_id')::uuid,p->>'featured_image_alt',p->>'before_image_alt',p->>'after_image_alt',(p->>'before_image_id')::uuid,(p->>'after_image_id')::uuid,(p->>'og_image_id')::uuid,p->>'seo_title',p->>'seo_description')
 on conflict(id) do update set title=excluded.title,slug=excluded.slug,location=excluded.location,project_type=excluded.project_type,scope=excluded.scope,materials=excluded.materials,status=excluded.status,featured=excluded.featured,published=excluded.published,display_order=excluded.display_order,featured_image_id=excluded.featured_image_id,featured_image_alt=excluded.featured_image_alt,before_image_alt=excluded.before_image_alt,after_image_alt=excluded.after_image_alt,before_image_id=excluded.before_image_id,after_image_id=excluded.after_image_id,og_image_id=excluded.og_image_id,seo_title=excluded.seo_title,seo_description=excluded.seo_description;
 delete from public.project_images where project_id=pid;
 insert into public.project_images(id,project_id,asset_id,alt_text,caption,display_order) select (i->>'id')::uuid,pid,(i->>'asset_id')::uuid,i->>'alt_text',i->>'caption',(i->>'display_order')::integer from jsonb_array_elements(p->'images') i;
 return pid;end$$;
revoke all on function public.save_project(jsonb) from public,anon;grant execute on function public.save_project(jsonb) to authenticated;
create function public.complete_quote(p_id uuid,p_token_hash text,p_admin jsonb,p_customer jsonb) returns boolean language plpgsql security definer set search_path='' as $$declare q public.quote_requests;begin
 select * into q from public.quote_requests where id=p_id and upload_token_hash=p_token_hash for update;
 if not found then raise exception 'Unknown submission';end if;if q.ready then return true;end if;
 if exists(select 1 from public.quote_files where quote_id=p_id and not verified) then raise exception 'Uploads not verified';end if;
 update public.quote_requests set ready=true where id=p_id;
 insert into public.email_outbox(quote_id,kind,payload) values(p_id,'admin',p_admin),(p_id,'customer',p_customer) on conflict(quote_id,kind) do nothing;
 return true;end$$;
revoke all on function public.complete_quote(uuid,text,jsonb,jsonb) from public,anon,authenticated;grant execute on function public.complete_quote(uuid,text,jsonb,jsonb) to service_role;
create function public.claim_email_jobs(p_limit integer default 10) returns setof public.email_outbox language plpgsql security definer set search_path='' as $$begin
 update public.email_outbox set status='review',last_error='Retry window expired; verify delivery before resending.' where status in('pending','failed','sending') and created_at<now()-interval '23 hours';
 return query with picked as(select id from public.email_outbox where ((status in('pending','failed') and next_attempt_at<=now()) or(status='sending' and locked_until<now())) and attempts<8 and created_at>now()-interval '23 hours' order by created_at limit least(p_limit,20) for update skip locked)
 update public.email_outbox e set status='sending',attempts=e.attempts+1,locked_until=now()+interval '2 minutes' from picked where e.id=picked.id returning e.*;end$$;
revoke all on function public.claim_email_jobs(integer) from public,anon,authenticated;grant execute on function public.claim_email_jobs(integer) to service_role;
-- Durable cleanup survives provider timeouts after a metadata deletion.
create table public.storage_deletions(id uuid primary key default gen_random_uuid(),bucket text not null,storage_path text not null,created_at timestamptz not null default now());
alter table public.storage_deletions enable row level security;
revoke all on public.storage_deletions from anon,authenticated;grant all on public.storage_deletions to service_role;
create function public.enqueue_storage_delete() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.storage_deletions(bucket,storage_path) values(case when tg_table_name='quote_files' then 'quote-files' else 'site-media' end,old.storage_path);return old;end$$;
revoke all on function public.enqueue_storage_delete() from public;
create trigger cleanup_media after delete on public.media_assets for each row execute function public.enqueue_storage_delete();
create trigger cleanup_quote_file after delete on public.quote_files for each row execute function public.enqueue_storage_delete();
commit;
