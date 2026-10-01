export function supabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}
export function siteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return "http://localhost:3000";
  return new URL(raw).origin;
}
