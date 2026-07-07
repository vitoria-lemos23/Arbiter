import { z } from "zod";

/** Cover-image constraints enforced on upload. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const imageUploadSchema = z.object({
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    message: "Image must be a PNG, JPEG, or WebP",
  }),
  sizeBytes: z
    .number()
    .int()
    .positive("Image is empty")
    .max(MAX_IMAGE_BYTES, "Image must be 2 MB or smaller"),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
