import { describe, expect, it } from "vitest";
import { tournamentMetadataSchema } from "./metadata";

const wellFormed = {
  name: "Winter Clash",
  description: "A cozy bracket",
  game: "Fighting",
  category: "Esports",
  tags: ["fps", "ranked"],
  imageUrl: "/api/images/abc",
};

describe("tournamentMetadataSchema", () => {
  it("accepts a well-formed doc", () => {
    const result = tournamentMetadataSchema.safeParse(wellFormed);
    expect(result.success).toBe(true);
  });

  it("defaults tags to an empty array when omitted", () => {
    const result = tournamentMetadataSchema.parse({ name: "Solo" });
    expect(result.tags).toEqual([]);
  });

  it("rejects an empty name", () => {
    expect(tournamentMetadataSchema.safeParse({ name: "  " }).success).toBe(
      false,
    );
  });

  it("trims the name", () => {
    const result = tournamentMetadataSchema.parse({ name: "  Padded  " });
    expect(result.name).toBe("Padded");
  });

  it("rejects an over-long name", () => {
    const result = tournamentMetadataSchema.safeParse({
      name: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an over-long description", () => {
    const result = tournamentMetadataSchema.safeParse({
      name: "ok",
      description: "d".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(
      tournamentMetadataSchema.safeParse({ name: "ok", tags }).success,
    ).toBe(false);
  });

  it("de-duplicates tags", () => {
    const result = tournamentMetadataSchema.parse({
      name: "ok",
      tags: ["a", "a", "b"],
    });
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("rejects a tag over 40 characters", () => {
    const result = tournamentMetadataSchema.safeParse({
      name: "ok",
      tags: ["x".repeat(41)],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an https imageUrl", () => {
    const result = tournamentMetadataSchema.safeParse({
      name: "ok",
      imageUrl: "https://cdn.example.com/cover.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-image relative imageUrl", () => {
    const result = tournamentMetadataSchema.safeParse({
      name: "ok",
      imageUrl: "/uploads/hack",
    });
    expect(result.success).toBe(false);
  });
});
