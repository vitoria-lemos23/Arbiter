import { describe, expect, it } from "vitest";
import { sniffImageMime } from "./sniffImageMime";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
// "RIFF" + 4-byte size + "WEBP"
const WEBP = [
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
];

describe("sniffImageMime", () => {
  it("detects png/jpeg/webp from magic bytes", () => {
    expect(sniffImageMime(new Uint8Array(PNG))).toBe("image/png");
    expect(sniffImageMime(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(sniffImageMime(new Uint8Array(WEBP))).toBe("image/webp");
  });

  it("returns null for non-image bytes (e.g. HTML spoofed as an image)", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script>");
    expect(sniffImageMime(html)).toBeNull();
  });

  it("returns null for a RIFF container that is not WEBP", () => {
    const wav = [
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ];
    expect(sniffImageMime(new Uint8Array(wav))).toBeNull();
  });

  it("returns null for a truncated header", () => {
    expect(sniffImageMime(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});
