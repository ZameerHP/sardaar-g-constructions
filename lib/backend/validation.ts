import { z } from "zod";
export const uuid = z.string().uuid();
const str = (max = 500) => z.string().trim().max(max).default("");
const name = z.string().trim().min(1).max(200);
const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const https = z
  .string()
  .max(2000)
  .refine(
    (s) => !s || (s.startsWith("https://") && !/[<>"\s]/.test(s)),
    "Use a valid HTTPS URL",
  )
  .default("");
const image = uuid.nullable().default(null);
const seo = {
  seo_title: str(150),
  seo_description: str(350),
  og_image_id: image,
};
const common = {
  id: uuid,
  title: name,
  slug,
  published: z.boolean().default(false),
  display_order: z.number().int().min(0).max(10000).default(0),
  ...seo,
};
export const imageSchema = z
  .object({
    id: uuid,
    asset_id: uuid,
    alt_text: str(500),
    caption: str(500),
    display_order: z.number().int().min(0).max(1000),
  })
  .strict();
export const schemas = {
  projects: z
    .object({
      ...common,
      location: str(200),
      project_type: str(100),
      scope: str(15000),
      materials: str(4000),
      status: z.enum(["Completed", "Ongoing"]).default("Completed"),
      featured: z.boolean().default(false),
      featured_image_id: image,
      featured_image_alt: str(500),
      before_image_id: image,
      before_image_alt: str(500),
      after_image_alt: str(500),
      after_image_id: image,
      images: z.array(imageSchema).max(80).default([]),
    })
    .strict()
    .superRefine((v, c) => {
      if (
        v.published &&
        (!v.location ||
          !v.scope ||
          !v.project_type ||
          !v.featured_image_id ||
          !v.featured_image_alt)
      )
        c.addIssue({
          code: "custom",
          message:
            "Published projects need location, type, scope, featured image and alt text.",
        });
      if (v.published && v.images.some((i) => !i.alt_text))
        c.addIssue({
          code: "custom",
          message: "Add alt text for all gallery images before publishing.",
        });
    }),
  services: z
    .object({
      ...common,
      summary: str(1500),
      description: str(25000),
      bullet_points: z
        .array(z.string().trim().min(1).max(500))
        .max(40)
        .default([]),
      image_id: image,
      image_alt: str(500),
      fallback_image: z
        .enum(["seattle-facade", "black-commercial", "timber-home"])
        .default("seattle-facade"),
    })
    .strict(),
  testimonials: z
    .object({
      id: uuid,
      client_name: name,
      company: str(200),
      review: z.string().trim().min(1).max(6000),
      rating: z.number().int().min(1).max(5).nullable().default(null),
      project_type: str(100),
      published: z.boolean(),
      display_order: z.number().int().min(0).max(10000).default(0),
    })
    .strict(),
  manufacturers: z
    .object({
      id: uuid,
      brand_name: name,
      logo_id: image,
      logo_alt: str(300),
      website: https,
      display_order: z.number().int().min(0).max(10000).default(0),
      published: z.boolean(),
    })
    .strict(),
  blog_posts: z
    .object({
      ...common,
      featured_image_id: image,
      image_alt: str(500),
      excerpt: str(1500),
      content: str(80000),
    })
    .strict()
    .superRefine((v, c) => {
      if (v.published && !v.content)
        c.addIssue({
          code: "custom",
          message: "Add article content before publishing.",
        });
    }),
  contact_settings: z
    .object({
      id: z.literal(1),
      phone: str(50),
      email: z.union([z.literal(""), z.string().email().max(254)]),
      instagram: https,
      service_area: str(500),
      address: str(500),
      maps_embed_url: z
        .string()
        .max(2500)
        .refine(
          (v) =>
            !v ||
            /^https:\/\/(www\.)?google\.com\/maps\/embed(?:\?|\/)/.test(v),
          "Use a Google Maps embed URL, not iframe HTML.",
        )
        .default(""),
    })
    .strict(),
};
export type Entity = keyof typeof schemas;
export const entities = Object.keys(schemas) as Entity[];
export const fileSchema = z
  .object({
    name: z.string().min(1).max(180),
    size: z
      .number()
      .int()
      .positive()
      .max(20 * 1024 * 1024),
    type: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
    category: z.enum(["drawing", "document", "photo"]).default("document"),
  })
  .strict()
  .refine(
    (f) =>
      f.type === "application/pdf"
        ? /\.pdf$/i.test(f.name)
        : /\.(jpe?g|png|webp)$/i.test(f.name),
    "Use PDF, JPG, PNG or WebP files.",
  );
export const quoteSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    company: str(160),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(35)
      .regex(/^[+\d\s().-]+$/),
    location: z.string().trim().min(1).max(180),
    type: z.enum([
      "Residential",
      "Multi-Family",
      "Commercial",
      "New Construction",
      "Exterior Renovation",
      "Other",
    ]),
    scope: z.string().trim().min(10).max(10000),
    size: str(180),
    timing: str(50),
    startDate: z
      .string()
      .max(10)
      .refine(
        (v) =>
          !v ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            Number.isFinite(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v),
        "Choose a valid date",
      )
      .default(""),
    message: str(5000),
    reference: str(300),
    consent: z.literal("yes"),
    token: uuid,
    website: z.literal("").default(""),
    source: z.enum(["quote", "contact"]).default("quote"),
    turnstile: z.string().min(1).max(2048),
    uploadSecret: z.string().min(60).max(100),
    files: z.array(fileSchema).max(6).default([]),
  })
  .strict()
  .refine(
    (v) => v.files.reduce((a, f) => a + f.size, 0) <= 60 * 1024 * 1024,
    "Maximum total upload size is 60 MB.",
  );
export const leadSchema = z
  .object({
    id: uuid,
    status: z.enum(["New", "Contacted", "Quoted", "Won", "Lost"]),
    internal_notes: str(15000),
  })
  .strict();
export function sniffType(bytes: Uint8Array) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b))
    return "image/png";
  const dec = new TextDecoder();
  if (
    dec.decode(bytes.slice(0, 4)) === "RIFF" &&
    dec.decode(bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  if (dec.decode(bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  return null;
}
