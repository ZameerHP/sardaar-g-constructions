import "server-only";
import { serviceClient } from "@/lib/supabase/server";
import { dbError, HttpError } from "./http";
import { sniffType } from "./validation";
export async function verifyStoredFile(
  bucket: string,
  file: { storage_path: string; size_bytes: number; mime_type: string },
) {
  const db = serviceClient();
  const { data, error } = await db.storage
    .from(bucket)
    .download(file.storage_path);
  dbError(error);
  if (!data || data.size !== file.size_bytes || data.size > 20 * 1024 * 1024)
    throw new HttpError(
      400,
      "An upload is incomplete or has an unexpected size. Remove it and try again.",
    );
  const detected = sniffType(
    new Uint8Array(await data.slice(0, 16).arrayBuffer()),
  );
  if (detected !== file.mime_type)
    throw new HttpError(
      400,
      "A file does not match its declared format. Use a genuine PDF, JPG, PNG or WebP file.",
    );
}
export async function assertAssets(record: any) {
  const ids = new Set<string>();
  for (const [key, value] of Object.entries(record))
    if (
      (key.endsWith("_image_id") || key === "image_id" || key === "logo_id") &&
      typeof value === "string"
    )
      ids.add(value);
  for (const image of record.images || []) ids.add(image.asset_id);
  if (!ids.size) return;
  const { data, error } = await serviceClient()
    .from("media_assets")
    .select("id")
    .in("id", [...ids])
    .eq("ready", true);
  dbError(error);
  if (data?.length !== ids.size)
    throw new HttpError(
      400,
      "Finish uploading the selected images before saving.",
    );
}
export async function signedUploads(bucket: string, files: any[]) {
  const db = serviceClient();
  const result = [];
  for (const f of files) {
    const { data, error } = await db.storage
      .from(bucket)
      .createSignedUploadUrl(f.storage_path, { upsert: false });
    dbError(error);
    result.push({
      id: f.id,
      path: f.storage_path,
      token: data!.token,
      bucket,
      name: f.filename,
    });
  }
  return result;
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160) || "document";
}
