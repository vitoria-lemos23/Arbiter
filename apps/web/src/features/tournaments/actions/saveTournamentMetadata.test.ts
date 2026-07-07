import { privateKeyToAccount } from "viem/accounts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMetadataMessage } from "../lib/metadataMessage";
import { tournamentMetadataSchema } from "../schema/metadata";

// Named fake for the metadata data-access layer — no real DB is touched.
const fakeDb = vi.hoisted(() => ({
  getMetadata: vi.fn<(address: string) => Promise<unknown>>(),
  createMetadata: vi.fn(async (_row: unknown) => undefined),
  updateMetadata: vi.fn(async (row: unknown) => row),
}));

// Named fake for on-chain creation-tx verification — no RPC is touched.
const fakeChain = vi.hoisted(() => ({
  organizerFromCreationTx: vi.fn<() => Promise<`0x${string}`>>(),
}));

vi.mock("../server/metadata", () => fakeDb);
vi.mock("../server/verifyTournamentTx", () => fakeChain);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { saveTournamentMetadata, updateTournamentMetadata } = await import(
  "./saveTournamentMetadata"
);

const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const OTHER = "0x000000000000000000000000000000000000dEaD" as const;
const ADDRESS = "0xabc0000000000000000000000000000000000001" as const;
const ORGANIZER = "0x1111111111111111111111111111111111111111" as const;
const TX_HASH = `0x${"ab".repeat(32)}` as `0x${string}`;

/** Input for the tx-gated create path (authority comes from the mined tx). */
function createInput(rawMetadata: Record<string, unknown>) {
  const metadata = tournamentMetadataSchema.parse(rawMetadata);
  return { tournamentAddress: ADDRESS, metadata, txHash: TX_HASH };
}

/** Input for the signature-gated update path. */
async function signedInput(rawMetadata: Record<string, unknown>) {
  const metadata = tournamentMetadataSchema.parse(rawMetadata);
  const message = await buildMetadataMessage(ADDRESS, metadata);
  const signature = await account.signMessage({ message });
  return { tournamentAddress: ADDRESS, metadata, signature };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeDb.getMetadata.mockResolvedValue(undefined);
  fakeChain.organizerFromCreationTx.mockResolvedValue(ORGANIZER);
});

describe("saveTournamentMetadata", () => {
  it("creates with ownerAddress set to the on-chain organizer", async () => {
    const result = await saveTournamentMetadata(
      createInput({ name: "Clash", tags: [] }),
    );

    expect(result).toEqual({ ok: true });
    expect(fakeDb.createMetadata).toHaveBeenCalledTimes(1);
    const row = fakeDb.createMetadata.mock.calls[0]?.[0] as {
      ownerAddress: string;
    };
    expect(row.ownerAddress).toBe(ORGANIZER.toLowerCase());
  });

  it("rejects invalid metadata without writing", async () => {
    const input = createInput({ name: "ok", tags: [] });
    const result = await saveTournamentMetadata({
      ...input,
      metadata: { ...input.metadata, name: "" },
    });
    expect(result.error).toBeTruthy();
    expect(fakeDb.createMetadata).not.toHaveBeenCalled();
  });

  it("rejects a malformed txHash without touching the chain or DB", async () => {
    const result = await saveTournamentMetadata({
      ...createInput({ name: "Clash", tags: [] }),
      txHash: "0x1234" as `0x${string}`,
    });
    expect(result.error).toBeTruthy();
    expect(fakeChain.organizerFromCreationTx).not.toHaveBeenCalled();
    expect(fakeDb.createMetadata).not.toHaveBeenCalled();
  });

  it("rejects when the creation tx cannot be verified", async () => {
    fakeChain.organizerFromCreationTx.mockRejectedValue(
      new Error("no such tx"),
    );
    const result = await saveTournamentMetadata(
      createInput({ name: "Clash", tags: [] }),
    );

    expect(result.error).toBe("Could not verify the creation transaction");
    expect(fakeDb.createMetadata).not.toHaveBeenCalled();
  });
});

describe("updateTournamentMetadata", () => {
  it("rejects an update signed by a non-owner", async () => {
    fakeDb.getMetadata.mockResolvedValue({
      tournamentAddress: ADDRESS.toLowerCase(),
      ownerAddress: OTHER.toLowerCase(),
      metadata: { name: "old", tags: [] },
    });
    const input = await signedInput({ name: "New", tags: [] });
    const result = await updateTournamentMetadata(input);

    expect(result.error).toBe("Only the metadata owner may update it");
    expect(fakeDb.updateMetadata).not.toHaveBeenCalled();
  });

  it("updates when signed by the owner", async () => {
    fakeDb.getMetadata.mockResolvedValue({
      tournamentAddress: ADDRESS.toLowerCase(),
      ownerAddress: account.address.toLowerCase(),
      metadata: { name: "old", tags: [] },
    });
    const input = await signedInput({ name: "New", tags: [] });
    const result = await updateTournamentMetadata(input);

    expect(result).toEqual({ ok: true });
    expect(fakeDb.updateMetadata).toHaveBeenCalledTimes(1);
  });
});
