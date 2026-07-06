import { privateKeyToAccount } from "viem/accounts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMetadataMessage } from "../lib/metadataMessage";
import { tournamentMetadataSchema } from "../schema/metadata";

// Named fake for the metadata data-access layer — no real DB is touched.
const fakeDb = vi.hoisted(() => ({
  getMetadata: vi.fn<(address: string) => Promise<unknown>>(),
  upsertMetadata: vi.fn(async (row: unknown) => row),
  updateMetadata: vi.fn(async (row: unknown) => row),
}));

vi.mock("../server/metadata", () => fakeDb);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { saveTournamentMetadata, updateTournamentMetadata } = await import(
  "./saveTournamentMetadata"
);

const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const OTHER = "0x000000000000000000000000000000000000dEaD" as const;
const ADDRESS = "0xabc0000000000000000000000000000000000001" as const;

async function signedInput(rawMetadata: Record<string, unknown>) {
  const metadata = tournamentMetadataSchema.parse(rawMetadata);
  const message = await buildMetadataMessage(ADDRESS, metadata);
  const signature = await account.signMessage({ message });
  return { tournamentAddress: ADDRESS, metadata, signature };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeDb.getMetadata.mockResolvedValue(undefined);
});

describe("saveTournamentMetadata", () => {
  it("upserts with ownerAddress set to the recovered signer", async () => {
    const input = await signedInput({ name: "Clash", tags: [] });
    const result = await saveTournamentMetadata(input);

    expect(result).toEqual({ ok: true });
    expect(fakeDb.upsertMetadata).toHaveBeenCalledTimes(1);
    const row = fakeDb.upsertMetadata.mock.calls[0]?.[0] as {
      ownerAddress: string;
    };
    expect(row.ownerAddress).toBe(account.address.toLowerCase());
  });

  it("rejects invalid metadata without writing", async () => {
    const input = await signedInput({ name: "ok", tags: [] });
    const result = await saveTournamentMetadata({
      ...input,
      metadata: { ...input.metadata, name: "" },
    });
    expect(result.error).toBeTruthy();
    expect(fakeDb.upsertMetadata).not.toHaveBeenCalled();
  });

  it("rejects a malformed signature", async () => {
    const input = await signedInput({ name: "Clash", tags: [] });
    const result = await saveTournamentMetadata({
      ...input,
      signature: "0x1234",
    });
    expect(result.error).toBeTruthy();
    expect(fakeDb.upsertMetadata).not.toHaveBeenCalled();
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
