import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES } from "../schema/image";
import { validateImageBytes } from "./validateImageBytes";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** A buffer that sniffs as PNG, padded to `size` total bytes. */
function pngOf(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  buf.set(PNG_HEADER);
  return buf;
}

describe("validateImageBytes", () => {
  it("accepts a real PNG within the size limit", () => {
    const result = validateImageBytes(pngOf(1024));
    expect(result).toEqual({ ok: true, mimeType: "image/png" });
  });

  it("rejects bytes that are not an allowed image (spoofed Content-Type)", () => {
    const html = new TextEncoder().encode("<html>not an image</html>");
    const result = validateImageBytes(html);
    expect(result.ok).toBe(false);
  });

  it("rejects a real image exceeding the size limit by actual length", () => {
    const result = validateImageBytes(pngOf(MAX_IMAGE_BYTES + 1));
    expect(result).toEqual({
      ok: false,
      error: "Image must be 2 MB or smaller",
    });
  });

  it("rejects an empty upload", () => {
    expect(validateImageBytes(new Uint8Array(0)).ok).toBe(false);
  });
});
