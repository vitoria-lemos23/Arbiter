import type { ProfileRow } from "@arbiter/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeStore = vi.hoisted(() => ({
  getProfileRows: vi.fn<(addrs: string[]) => Promise<ProfileRow[]>>(),
}));

vi.mock("./profileStore", () => fakeStore);

const { getProfilesByAddresses } = await import("./getProfilesByAddresses");

const rowA: ProfileRow = {
  userAddress: "0xaaa",
  metadata: { displayName: "Alice" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const rowB: ProfileRow = {
  userAddress: "0xbbb",
  metadata: {
    displayName: "Bob",
    avatarUrl: "/api/images/550e8400-e29b-41d4-a716-446655440000",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe("getProfilesByAddresses", () => {
  it("returns a map keyed by lowercase address", async () => {
    fakeStore.getProfileRows.mockResolvedValue([rowA, rowB]);
    const map = await getProfilesByAddresses(["0xAAA", "0xBBB"]);
    expect(map.get("0xaaa")?.displayName).toBe("Alice");
    expect(map.get("0xbbb")?.displayName).toBe("Bob");
  });

  it("leaves absent addresses out of the map", async () => {
    fakeStore.getProfileRows.mockResolvedValue([rowA]);
    const map = await getProfilesByAddresses(["0xaaa", "0xccc"]);
    expect(map.has("0xaaa")).toBe(true);
    expect(map.has("0xccc")).toBe(false);
  });

  it("returns an empty map for an empty address list", async () => {
    fakeStore.getProfileRows.mockResolvedValue([]);
    const map = await getProfilesByAddresses([]);
    expect(map.size).toBe(0);
    expect(fakeStore.getProfileRows).not.toHaveBeenCalled();
  });
});
