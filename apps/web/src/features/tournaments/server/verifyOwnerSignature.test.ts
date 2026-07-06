import type { TournamentMetadataDoc } from "@arbiter/db";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { buildMetadataMessage } from "../lib/metadataMessage";
import { recoverMetadataSigner } from "./verifyOwnerSignature";

// Deterministic test key (Hardhat account #0).
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const account = privateKeyToAccount(PRIVATE_KEY);

const ADDRESS = "0xabc0000000000000000000000000000000000001" as const;
const doc: TournamentMetadataDoc = { name: "Clash", tags: [] };

async function sign(
  address: `0x${string}`,
  metadata: TournamentMetadataDoc,
): Promise<`0x${string}`> {
  const message = await buildMetadataMessage(address, metadata);
  return account.signMessage({ message });
}

describe("recoverMetadataSigner", () => {
  it("recovers the signer of a valid signature", async () => {
    const signature = await sign(ADDRESS, doc);
    const signer = await recoverMetadataSigner({
      tournamentAddress: ADDRESS,
      metadata: doc,
      signature,
    });
    expect(signer.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("recovers a different address when the metadata is tampered with", async () => {
    const signature = await sign(ADDRESS, doc);
    const signer = await recoverMetadataSigner({
      tournamentAddress: ADDRESS,
      metadata: { ...doc, name: "Tampered" },
      signature,
    });
    expect(signer.toLowerCase()).not.toBe(account.address.toLowerCase());
  });

  it("uses an injected recover function when provided", async () => {
    const signer = await recoverMetadataSigner(
      { tournamentAddress: ADDRESS, metadata: doc, signature: "0xdead" },
      async () => account.address,
    );
    expect(signer.toLowerCase()).toBe(account.address.toLowerCase());
  });
});
