import type { TournamentMetadataDoc } from "@arbiter/db";
import { describe, expect, it } from "vitest";
import {
  buildMetadataMessage,
  canonicalJson,
  sha256Hex,
} from "./metadataMessage";

const ADDRESS = "0xAbC0000000000000000000000000000000000001" as const;

const doc: TournamentMetadataDoc = {
  name: "Clash",
  description: "desc",
  game: "Fighting",
  tags: ["a", "b"],
};

describe("canonicalJson", () => {
  it("is independent of key insertion order", () => {
    const a = canonicalJson({ name: "x", game: "y", tags: [] });
    const b = canonicalJson({ tags: [], game: "y", name: "x" });
    expect(a).toBe(b);
  });

  it("preserves array order", () => {
    expect(canonicalJson({ tags: ["b", "a"] })).not.toBe(
      canonicalJson({ tags: ["a", "b"] }),
    );
  });
});

describe("sha256Hex", () => {
  it("is deterministic and 64 hex chars", async () => {
    const h1 = await sha256Hex("hello");
    const h2 = await sha256Hex("hello");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("buildMetadataMessage", () => {
  it("lowercases the address and embeds the doc hash", async () => {
    const message = await buildMetadataMessage(ADDRESS, doc);
    const expectedHash = await sha256Hex(canonicalJson(doc));
    expect(message).toBe(
      `Arbiter — save tournament metadata\naddress: ${ADDRESS.toLowerCase()}\nhash: ${expectedHash}`,
    );
  });

  it("produces the same message for key-reordered metadata", async () => {
    const reordered = {
      tags: doc.tags,
      game: doc.game,
      description: doc.description,
      name: doc.name,
    };
    const a = await buildMetadataMessage(ADDRESS, doc);
    const b = await buildMetadataMessage(
      ADDRESS,
      reordered as TournamentMetadataDoc,
    );
    expect(a).toBe(b);
  });
});
