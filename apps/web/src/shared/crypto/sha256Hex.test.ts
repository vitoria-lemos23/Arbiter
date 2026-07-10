import { describe, expect, it } from "vitest";
import { sha256Hex } from "./sha256Hex";

describe("sha256Hex", () => {
  it("returns a 64-char lowercase hex string", async () => {
    const hash = await sha256Hex("hello");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("matches the known SHA-256 of 'hello'", async () => {
    // Well-known test vector: SHA-256("hello")
    const hash = await sha256Hex("hello");
    expect(hash).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("produces different hashes for different inputs", async () => {
    const a = await sha256Hex("alice");
    const b = await sha256Hex("bob");
    expect(a).not.toBe(b);
  });

  it("is deterministic (same input always yields same output)", async () => {
    const a = await sha256Hex("determinism");
    const b = await sha256Hex("determinism");
    expect(a).toBe(b);
  });
});
