import { cache } from "react";
import { publicClient } from "./supabase/server";
import { supabaseConfig } from "./supabase/config";
import { services, manufacturers, type Content, type RecordData } from "./data";
const image = (id: string | null) => (id ? "/api/media/" + id : "");
export const getContent = cache(async (): Promise<Content> => {
  const base: Content = {
    settings: {
      instagram: "https://www.instagram.com/sardaarg_ltd/",
      service_area: "British Columbia, Canada",
    },
    services,
    projects: [],
    articles: [],
    testimonials: [],
    manufacturers,
  };
  if (!supabaseConfig()) return base;
  try {
    const db = publicClient();
    const results = await Promise.all([
      db
        .from("projects")
        .select("*,images:project_images(*)")
        .eq("published", true)
        .order("display_order")
        .order("created_at", { ascending: false }),
      db
        .from("services")
        .select("*")
        .eq("published", true)
        .order("display_order"),
      db
        .from("manufacturers")
        .select("*")
        .eq("published", true)
        .order("display_order"),
      db
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("display_order"),
      db.from("contact_settings").select("*").eq("id", 1).single(),
      db
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false }),
    ]);
    for (const r of results) if (r.error) throw r.error;
    const [projects, svc, brands, reviews, settings, posts] = results.map(
      (r) => r.data,
    ) as any[];
    return {
      settings: settings || base.settings,
      services: svc.map((s: any) => ({
        id: s.slug,
        title: s.title,
        summary: s.summary,
        body: s.description,
        materials: s.bullet_points.join(", "),
        bulletPoints: s.bullet_points,
        image: image(s.image_id) || s.fallback_image,
        imageAlt: s.image_alt,
        seoTitle: s.seo_title,
        seoDescription: s.seo_description,
        ogImage: image(s.og_image_id) || image(s.image_id),
      })),
      manufacturers: brands.map((b: any) => b.brand_name),
      manufacturerDetails: brands.map((b: any) => ({
        ...b,
        logo: image(b.logo_id),
      })),
      projects: projects.map((p: any): RecordData => ({
        id: p.id,
        kind: "project",
        slug: p.slug,
        title: p.title,
        published: true,
        data: {
          location: p.location,
          type: p.project_type,
          scope: p.scope,
          materials: p.materials,
          status: p.status,
          featured: p.featured,
          cover: image(p.featured_image_id),
          coverAlt: p.featured_image_alt,
          before: image(p.before_image_id),
          beforeAlt: p.before_image_alt,
          afterAlt: p.after_image_alt,
          after: image(p.after_image_id),
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          ogImage: image(p.og_image_id) || image(p.featured_image_id),
          updatedAt: p.updated_at,
          media: p.images
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((i: any) => ({
              url: image(i.asset_id),
              alt: i.alt_text,
              caption: i.caption,
            })),
        },
      })),
      articles: posts.map((p: any) => ({
        id: p.id,
        kind: "article",
        slug: p.slug,
        title: p.title,
        published: true,
        data: {
          summary: p.excerpt,
          body: p.content,
          cover: image(p.featured_image_id),
          coverAlt: p.image_alt,
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          ogImage: image(p.og_image_id) || image(p.featured_image_id),
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        },
      })),
      testimonials: reviews.map((r: any) => ({
        id: r.id,
        kind: "testimonial",
        slug: r.id,
        title: r.client_name,
        published: true,
        data: {
          body: r.review,
          company: r.company,
          rating: r.rating,
          projectType: r.project_type,
        },
      })),
    };
  } catch {
    console.error("Public content unavailable");
    return { ...base, services: [], manufacturers: [], unavailable: true };
  }
});
