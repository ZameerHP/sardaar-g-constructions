"use client";
import { browserClient } from "@/lib/supabase/browser";
export async function api(url: string, method = "GET", data?: unknown) {
  const r = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(d.error || "The operation failed.");
  return d;
}
export async function optimizeImage(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("Choose a JPG, PNG or WebP image under 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Unable to optimize this image.")),
        "image/webp",
        0.86,
      ),
    );
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    });
  } finally {
    bitmap.close();
  }
}
export async function directUpload(
  upload: { bucket: string; path: string; token: string },
  file: File,
) {
  const { error } = await browserClient()
    .storage.from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file, {
      contentType: file.type,
      upsert: false,
    });
  if (
    error &&
    !(
      error.statusCode === "409" ||
      /already exists|duplicate/i.test(error.message)
    )
  )
    throw new Error(
      "Upload failed. Please retry; completed files will be kept.",
    );
}
export async function uploadAdminImage(original: File) {
  const file = await optimizeImage(original);
  const { upload } = await api("/api/admin/uploads", "POST", {
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      category: "photo",
    },
  });
  await directUpload(upload, file);
  return api("/api/admin/uploads", "POST", {
    action: "complete",
    id: upload.id,
  });
}
