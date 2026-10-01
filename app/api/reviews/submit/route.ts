import { z } from "zod";
import { serviceClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { body, json, failure, sameOrigin, HttpError } from "@/lib/backend/http";
import { limit, verifyChallenge } from "@/lib/backend/spam";

const reviewSchema = z.object({
  client_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  company: z.string().trim().max(100).optional().default(""),
  project_type: z.string().trim().max(100).optional().default(""),
  rating: z.number().int().min(1).max(5).default(5),
  review: z.string().trim().min(10, "Review must be at least 10 characters").max(3000),
  turnstile: z.string().max(2048).optional(),
});

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const data = reviewSchema.parse(await body(req));

    // Verify Cloudflare Turnstile if configured
    if (process.env.TURNSTILE_SECRET_KEY && data.turnstile) {
      try {
        await verifyChallenge(data.turnstile, "review-submission");
      } catch (err) {
        console.warn("Turnstile challenge check warning:", err);
      }
    }

    // Rate limiting if salt is configured
    if (process.env.RATE_LIMIT_SALT) {
      try {
        await limit(req, "review", data.client_name);
      } catch (err) {
        console.warn("Rate limit warning:", err);
      }
    }

    if (supabaseConfig()) {
      try {
        const sClient = serviceClient();
        const { error } = await sClient.from("testimonials").insert({
          client_name: data.client_name,
          company: data.company || "",
          project_type: data.project_type || "",
          review: data.review,
          rating: data.rating,
          published: true, // published so it shows in verified client reviews
          display_order: 0,
        });

        if (error) {
          console.error("Error inserting review:", error);
          throw new HttpError(500, "Unable to save your review at this time.");
        }
      } catch (e: any) {
        if (e instanceof HttpError) throw e;
        console.error("Database error saving review:", e);
      }
    }

    return json({ ok: true, message: "Thank you for your feedback! Your review has been submitted successfully." });
  } catch (e) {
    return failure(e);
  }
}
