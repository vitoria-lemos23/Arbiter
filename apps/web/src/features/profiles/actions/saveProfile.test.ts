import { privateKeyToAccount } from "viem/accounts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildProfileMessage } from "../lib/profileMessage";
import { profileDocSchema } from "../schema/profile";

// Named fake for the profile data-access layer — no real DB is touched.
const fakeStore = vi.hoisted(() => ({
  upsertProfile: vi.fn(async (_row: unknown) => undefined),
}));

vi.mock("../server/profileStore", () => fakeStore);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { saveProfile } = await import("./saveProfile");

const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const OTHER_ACCOUNT = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);
const ADDRESS = account.address;

async function signedInput(raw: Record<string, unknown>) {
  const metadata = profileDocSchema.parse(raw);
  const message = await buildProfileMessage(ADDRESS, metadata);
  const signature = await account.signMessage({ message });
  return { userAddress: ADDRESS, metadata, signature };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveProfile", () => {
  it("upserts when signed by the subject address", async () => {
    const input = await signedInput({ displayName: "Ada" });
    const result = await saveProfile(input);
    expect(result).toEqual({ ok: true });
    expect(fakeStore.upsertProfile).toHaveBeenCalledTimes(1);
  });

  it("rejects a signature from a different address", async () => {
    const metadata = profileDocSchema.parse({ displayName: "Ada" });
    const message = await buildProfileMessage(ADDRESS, metadata);
    const signature = await OTHER_ACCOUNT.signMessage({ message });
    const result = await saveProfile({
      userAddress: ADDRESS,
      metadata,
      signature,
    });
    expect(result).toMatchObject({ ok: false });
    expect(fakeStore.upsertProfile).not.toHaveBeenCalled();
  });

  it("rejects an empty display name without upsert", async () => {
    const input = await signedInput({ displayName: "Ada" });
    const result = await saveProfile({
      ...input,
      metadata: { ...input.metadata, displayName: "" },
    });
    expect(result).toMatchObject({ ok: false });
    expect(fakeStore.upsertProfile).not.toHaveBeenCalled();
  });

  it("rejects a malformed userAddress", async () => {
    const input = await signedInput({ displayName: "Ada" });
    const result = await saveProfile({
      ...input,
      userAddress: "not-an-address" as never,
    });
    expect(result).toMatchObject({ ok: false });
  });

  it("rejects tampered metadata (hash mismatch -> wrong signer recovered)", async () => {
    const input = await signedInput({ displayName: "Ada" });
    const result = await saveProfile({
      ...input,
      metadata: { ...input.metadata, displayName: "Eve" },
    });
    // The recovered address won't match because the message was signed for "Ada"
    expect(result).toMatchObject({ ok: false });
    expect(fakeStore.upsertProfile).not.toHaveBeenCalled();
  });
});
