import { describe, expect, it } from "vitest";
import { profileDocSchema } from "./profile";

describe("profileDocSchema", () => {
  it("accepts a valid name-only doc", () => {
    const result = profileDocSchema.safeParse({ displayName: "Ada" });
    expect(result.success).toBe(true);
  });

  it("trims the display name", () => {
    const result = profileDocSchema.safeParse({ displayName: "  Ada  " });
    expect(result.success && result.data.displayName).toBe("Ada");
  });

  it("rejects an empty display name", () => {
    const result = profileDocSchema.safeParse({ displayName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only display name", () => {
    const result = profileDocSchema.safeParse({ displayName: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a display name over 50 chars", () => {
    const result = profileDocSchema.safeParse({ displayName: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("accepts a valid avatarUrl", () => {
    const result = profileDocSchema.safeParse({
      displayName: "Ada",
      avatarUrl: "/api/images/550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an external/absolute avatarUrl", () => {
    const result = profileDocSchema.safeParse({
      displayName: "Ada",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a relative non-api-images path", () => {
    const result = profileDocSchema.safeParse({
      displayName: "Ada",
      avatarUrl: "/public/avatar.png",
    });
    expect(result.success).toBe(false);
  });
});
