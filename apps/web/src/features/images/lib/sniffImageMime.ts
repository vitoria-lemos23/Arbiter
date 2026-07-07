import type { AllowedImageMimeType } from "../schema/image";

/**
 * Detect an image's real MIME type from its leading magic bytes, independent of
 * any client-declared `Content-Type`. Returns one of the allow-listed types, or
 * `null` when the bytes don't match a supported image — so an upload can be
 * rejected on its actual content rather than a spoofable header.
 *
 * @example
 * sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])) // "image/jpeg"
 */
export function sniffImageMime(bytes: Uint8Array): AllowedImageMimeType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  // WebP: "RIFF" .... "WEBP" (size word at bytes 4-7 is skipped).
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image/webp";
  }
  return null;
}

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.length < prefix.length) return false;
  return prefix.every((byte, i) => bytes[i] === byte);
}
