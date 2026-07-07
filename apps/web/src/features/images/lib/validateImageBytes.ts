import type { AllowedImageMimeType } from "../schema/image";
import { imageUploadSchema } from "../schema/image";
import { sniffImageMime } from "./sniffImageMime";

export type ImageValidation =
  | { ok: true; mimeType: AllowedImageMimeType }
  | { ok: false; error: string };

/**
 * Validate raw upload bytes against the cover-image allow-list and size limit,
 * using the sniffed MIME (not any client-declared header) and the true buffer
 * length. Returns the authoritative MIME to store, or a user-facing error.
 */
export function validateImageBytes(data: Uint8Array): ImageValidation {
  const detectedMime = sniffImageMime(data);
  const parsed = imageUploadSchema.safeParse({
    mimeType: detectedMime,
    sizeBytes: data.length,
  });
  if (parsed.success) return { ok: true, mimeType: parsed.data.mimeType };
  // A null sniff fails the enum with a generic Zod message; give a clearer one.
  const error = detectedMime
    ? (parsed.error.issues[0]?.message ?? "Invalid image")
    : "Image must be a PNG, JPEG, or WebP";
  return { ok: false, error };
}
