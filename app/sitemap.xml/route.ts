export const dynamic = "force-dynamic";
import { getContent } from "@/lib/content";
import { siteOrigin } from "@/lib/supabase/config";
export async function GET() {
  const c = await getContent();
  const origin = siteOrigin();
  const paths = [
    "/",
    "/about",
    "/services",
    "/projects",
    "/industries",
    "/our-process",
    "/service-areas",
    "/contact",
    "/request-a-quote",
    "/privacy",
    ...c.services.map((s) => "/services/" + s.id),
    ...c.projects.map((p) => "/projects/" + p.slug),
    ...(c.articles.length ? ["/insights"] : []),
    ...c.articles.map((a) => "/insights/" + a.slug),
  ];
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths.map((p) => "<url><loc>" + origin + p + "</loc></url>").join("") +
      "</urlset>",
    { headers: { "Content-Type": "application/xml" } },
  );
}
