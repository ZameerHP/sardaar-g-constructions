import { newId } from "@/lib/id";
export type Field = {
  key: string;
  label: string;
  type?:
    | "textarea"
    | "lines"
    | "image"
    | "checkbox"
    | "number"
    | "select"
    | "email"
    | "url";
  options?: string[];
  required?: boolean;
  max?: number;
};
const title: Field = { key: "title", label: "Title", required: true, max: 200 };
const slug: Field = {
  key: "slug",
  label: "URL slug",
  required: true,
  max: 160,
};
const order: Field = {
  key: "display_order",
  label: "Display order",
  type: "number",
};
const seo: Field[] = [
  { key: "seo_title", label: "SEO title", max: 150 },
  {
    key: "seo_description",
    label: "SEO description",
    type: "textarea",
    max: 350,
  },
  {
    key: "og_image_id",
    label: "Social sharing image (optional)",
    type: "image",
  },
];
export const sections = [
  ["projects", "Projects"],
  ["services", "Services"],
  ["testimonials", "Testimonials"],
  ["manufacturers", "Manufacturers"],
  ["contact_settings", "Contact details"],
  ["blog_posts", "Articles"],
] as const;
export const fields: Record<string, Field[]> = {
  projects: [
    title,
    slug,
    { key: "location", label: "Location" },
    {
      key: "project_type",
      label: "Project type",
      type: "select",
      options: [
        "Residential",
        "Multi-Family",
        "Commercial",
        "New Construction",
        "Exterior Renovation",
        "Other",
      ],
    },
    { key: "scope", label: "Scope of work", type: "textarea", max: 15000 },
    {
      key: "materials",
      label: "Materials / systems",
      type: "textarea",
      max: 4000,
    },
    {
      key: "status",
      label: "Project status",
      type: "select",
      options: ["Completed", "Ongoing"],
    },
    { key: "featured", label: "Feature on homepage", type: "checkbox" },
    { key: "featured_image_id", label: "Featured image", type: "image" },
    { key: "featured_image_alt", label: "Featured image alt text" },
    { key: "before_image_id", label: "Before image", type: "image" },
    { key: "before_image_alt", label: "Before image alt text" },
    { key: "after_image_alt", label: "After image alt text" },
    { key: "after_image_id", label: "After image", type: "image" },
    ...seo,
    order,
  ],
  services: [
    title,
    slug,
    {
      key: "summary",
      label: "Short introduction",
      type: "textarea",
      max: 1500,
    },
    { key: "description", label: "Description", type: "textarea", max: 25000 },
    {
      key: "bullet_points",
      label: "Materials / bullet points — one per line",
      type: "lines",
    },
    { key: "image_id", label: "Service image", type: "image" },
    { key: "image_alt", label: "Image alt text" },
    {
      key: "fallback_image",
      label: "Reference image if no upload is selected",
      type: "select",
      options: ["seattle-facade", "black-commercial", "timber-home"],
    },
    ...seo,
    order,
  ],
  testimonials: [
    { key: "client_name", label: "Client name", required: true },
    { key: "company", label: "Company (optional)" },
    {
      key: "review",
      label: "Review",
      type: "textarea",
      required: true,
      max: 6000,
    },
    {
      key: "rating",
      label: "Rating (optional)",
      type: "select",
      options: ["", "1", "2", "3", "4", "5"],
    },
    { key: "project_type", label: "Project type (optional)" },
    order,
  ],
  manufacturers: [
    { key: "brand_name", label: "Brand name", required: true },
    { key: "logo_id", label: "Logo", type: "image" },
    { key: "logo_alt", label: "Logo alt text" },
    { key: "website", label: "Website (optional)", type: "url" },
    order,
  ],
  contact_settings: [
    { key: "phone", label: "Company phone" },
    { key: "email", label: "Company email", type: "email" },
    { key: "instagram", label: "Instagram URL", type: "url" },
    { key: "service_area", label: "Service area" },
    { key: "address", label: "Address / location (optional)" },
    {
      key: "maps_embed_url",
      label: "Google Maps embed URL (optional)",
      type: "url",
      max: 2500,
    },
  ],
  blog_posts: [
    title,
    slug,
    { key: "featured_image_id", label: "Featured image", type: "image" },
    { key: "image_alt", label: "Image alt text" },
    { key: "excerpt", label: "Excerpt", type: "textarea", max: 1500 },
    {
      key: "content",
      label: "Article content — plain text, paragraphs separated by new lines",
      type: "textarea",
      required: true,
      max: 80000,
    },
    ...seo,
    order,
  ],
};
export function newRecord(section: string) {
  const record: Record<string, any> = {
    id: section === "contact_settings" ? 1 : newId(),
  };
  for (const f of fields[section])
    record[f.key] =
      f.type === "image"
        ? null
        : f.type === "checkbox"
          ? false
          : f.type === "number"
            ? 0
            : f.type === "lines"
              ? []
              : f.type === "select"
                ? f.options?.[0] || ""
                : "";
  if (section !== "contact_settings") record.published = false;
  if (section === "projects") record.images = [];
  if (section === "testimonials") record.rating = null;
  return record;
}
export function cleanRecord(section: string, record: any) {
  const result: any = { id: record.id };
  for (const f of fields[section])
    result[f.key] =
      f.type === "lines"
        ? (record[f.key] || []).map((s: string) => s.trim()).filter(Boolean)
        : record[f.key];
  if (section !== "contact_settings") result.published = record.published;
  if (section === "projects")
    result.images = (record.images || []).map((i: any, index: number) => ({
      id: i.id,
      asset_id: i.asset_id,
      alt_text: i.alt_text || "",
      caption: i.caption || "",
      display_order: index,
    }));
  return result;
}
