export const dynamic = "force-dynamic";
import { siteOrigin } from "@/lib/supabase/config";
export function GET() {
  return new Response(
    process.env.SITE_INDEXABLE === "true"
      ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nAllow: /api/media/\nSitemap: ${siteOrigin()}/sitemap.xml\n`
      : "User-agent: *\nDisallow: /\n",
    { headers: { "Content-Type": "text/plain" } },
  );
}
