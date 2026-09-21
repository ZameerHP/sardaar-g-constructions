import { z } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = new URL(process.env.NEXT_PUBLIC_SITE_URL || req.url).origin;
  if (!origin || origin !== allowed)
    throw new HttpError(403, "Invalid request origin.");
}
export async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 180000)
    throw new HttpError(413, "Request is too large.");
  // Enforce the byte limit while reading, including chunked requests that omit
  // Content-Length. Do not buffer an unbounded attacker-controlled body first.
  const reader = req.body?.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let received = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > 180000) {
          await reader.cancel().catch(() => {});
          throw new HttpError(413, "Request is too large.");
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      400,
    );
  console.error(
    "Backend operation failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  return json(
    { error: "The operation could not be completed. Please retry." },
    503,
  );
}
export function dbError(error: any) {
  if (!error) return;
  if (error.code === "23505")
    throw new HttpError(409, "That slug or record already exists.");
  if (error.code === "23503")
    throw new HttpError(
      409,
      "This item is still used by other content. Remove those references first.",
    );
  throw new Error(error.message || "Database operation failed");
}
