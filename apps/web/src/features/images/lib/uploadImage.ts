import { imageUploadSchema } from "../schema/image";

/**
 * Client-side image upload shared by the tournament cover picker and the
 * profile avatar picker. Uploads to the `/api/images` route (which re-validates
 * the actual bytes) and returns the served `/api/images/:id` url.
 */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/images", { method: "POST", body });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? "Upload failed");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

/**
 * Fast client-side pre-check reusing the same schema the upload route enforces
 * on the actual bytes, so the two paths can't drift. Returns an error message
 * or null.
 */
export function validateImageFile(file: File): string | null {
  const result = imageUploadSchema.safeParse({
    mimeType: file.type,
    sizeBytes: file.size,
  });
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? "Invalid image");
}
