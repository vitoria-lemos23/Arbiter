import type { ProfileDoc } from "@arbiter/db";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "@/shared/crypto";
import { buildProfileMessage } from "./profileMessage";

const ADDRESS = "0xAbC0000000000000000000000000000000000001" as const;

const doc: ProfileDoc = { displayName: "Ada" };

describe("buildProfileMessage", () => {
  it("lowercases the address and embeds the doc hash", async () => {
    const message = await buildProfileMessage(ADDRESS, doc);
    const expectedHash = await sha256Hex(canonicalJson(doc));
    expect(message).toBe(
      `Arbiter \u2014 save profile\naddress: ${ADDRESS.toLowerCase()}\nhash: ${expectedHash}`,
    );
  });

  it("produces the same message for key-reordered docs", async () => {
    const a = await buildProfileMessage(ADDRESS, {
      displayName: "Ada",
      avatarUrl: "/api/images/abc",
    });
    const b = await buildProfileMessage(ADDRESS, {
      avatarUrl: "/api/images/abc",
      displayName: "Ada",
    });
    expect(a).toBe(b);
  });
});
