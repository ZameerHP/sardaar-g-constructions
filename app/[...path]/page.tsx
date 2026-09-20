import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { siteOrigin } from "@/lib/supabase/config";
import { ContentPage } from "@/app/site";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string[] }>;
}): Promise<Metadata> {
  const { path } = await params;
  const data = await getContent();
  const key = path.join("/");
  const s = data.services.find((s) => key === "services/" + s.id);
  const r = [...data.projects, ...data.articles].find(
    (r) => key === (r.kind === "project" ? "projects/" : "insights/") + r.slug,
  );
  const title =
    r?.data.seoTitle ||
    s?.seoTitle ||
    r?.title ||
    s?.title ||
    path[0].replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description =
    r?.data.seoDescription ||
    s?.seoDescription ||
    s?.summary ||
    r?.data.summary ||
    "Exterior cladding and siding installation for residential, multi-family and commercial projects throughout British Columbia.";
  const image = r?.data.ogImage || s?.ogImage;
  return {
    title: title + " | Sardaar G Construction",
    description,
    alternates: { canonical: "/" + key },
    openGraph: {
      title,
      description,
      url: "/" + key,
      type: r?.kind === "article" ? "article" : "website",
      images: image
        ? [{ url: image, alt: r?.data.coverAlt || s?.imageAlt || title }]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const key = path.join("/");
  const c = await getContent();
  const pages = [
    "about",
    "services",
    "projects",
    "industries",
    "our-process",
    "contact",
    "request-a-quote",
    "service-areas",
    "privacy",
  ];
  const record = [...c.projects, ...c.articles].find(
    (r) => key === (r.kind === "project" ? "projects/" : "insights/") + r.slug,
  );
  const service = c.services.find((s) => key === "services/" + s.id);
  if (
    !pages.includes(key) &&
    !(key === "insights" && c.articles.length) &&
    !service &&
    !record
  )
    notFound();
  const structured =
    record?.kind === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: record.title,
          description: record.data.summary,
          datePublished: record.data.createdAt,
          dateModified: record.data.updatedAt,
          image: record.data.cover
            ? siteOrigin() + record.data.cover
            : undefined,
          author: {
            "@type": "Organization",
            name: "Sardaar G Construction Ltd.",
          },
          mainEntityOfPage: siteOrigin() + "/" + key,
        }
      : service
        ? {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.body,
            areaServed: c.settings.service_area,
            provider: {
              "@type": "Organization",
              name: "Sardaar G Construction Ltd.",
            },
          }
        : record
          ? {
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: record.title,
              description: record.data.scope,
              url: siteOrigin() + "/" + key,
              image: record.data.cover
                ? siteOrigin() + record.data.cover
                : undefined,
            }
          : null;
  return (
    <>
      {structured && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ContentPage path={key} content={c} record={record} />
    </>
  );
}
