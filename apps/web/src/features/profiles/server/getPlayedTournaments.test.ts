import type { Tournament, TournamentMetadataDoc } from "@arbiter/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Named fakes for the two dependencies `getPlayedTournaments` touches:
 * 1. `@arbiter/db` — the Drizzle query builder chain. We mock the full
 *    `.select().from().innerJoin().leftJoin().where().orderBy()` chain so
 *    the function under test executes without a real database.
 * 2. `reconcile` — the metadata trust-check (tested elsewhere); we stub it
 *    to return whatever metadata.metadata the row carries.
 */

const fakeRows = vi.hoisted(() => ({ rows: [] as unknown[] }));

const fakeOrderBy = vi.hoisted(() => vi.fn(() => fakeRows.rows));
const fakeWhere = vi.hoisted(() => vi.fn(() => ({ orderBy: fakeOrderBy })));
const fakeLeftJoin = vi.hoisted(() => vi.fn(() => ({ where: fakeWhere })));
const fakeInnerJoin = vi.hoisted(() =>
  vi.fn(() => ({ leftJoin: fakeLeftJoin })),
);
const fakeFrom = vi.hoisted(() => vi.fn(() => ({ innerJoin: fakeInnerJoin })));
const fakeSelect = vi.hoisted(() => vi.fn(() => ({ from: fakeFrom })));

vi.mock("@arbiter/db", () => ({
  db: { select: fakeSelect },
  registration: {
    player: "player",
    tournament: "tournament",
    registeredAt: "registeredAt",
  },
  tournament: { address: "address" },
  tournamentMetadata: { tournamentAddress: "tournamentAddress" },
}));

vi.mock("@/features/tournaments/server/reconcileMetadata", () => ({
  reconcile: (
    _chain: Tournament,
    meta: { metadata: TournamentMetadataDoc } | null,
  ) => (meta ? meta.metadata : null),
}));

const { getPlayedTournaments } = await import("./getPlayedTournaments");

const now = new Date();

const tournamentA: Tournament = {
  address: "0xaaa0000000000000000000000000000000000001",
  organizer: "0xorg1",
  maxPlayers: 8,
  format: 0,
  prize: "0",
  entryFee: "0",
  startDate: now,
  endDate: now,
  champion: null,
  index: "0",
  blockNumber: "1",
  createdAt: now,
  txHash: "0x123",
  completedAt: null,
};

const tournamentB: Tournament = {
  address: "0xbbb0000000000000000000000000000000000002",
  organizer: "0xorg2",
  maxPlayers: 4,
  format: 0,
  prize: "1000000000000000000",
  entryFee: "0",
  startDate: now,
  endDate: now,
  champion: "0xplayer",
  index: "1",
  blockNumber: "2",
  createdAt: now,
  txHash: "0x456",
  completedAt: now,
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeRows.rows = [];
});

describe("getPlayedTournaments", () => {
  it("returns played tournaments newest-first with reconciled metadata", async () => {
    const metaDoc: TournamentMetadataDoc = { name: "Clash", tags: ["pvp"] };
    fakeRows.rows = [
      {
        tournament: tournamentA,
        metadata: { ownerAddress: "0xorg1", metadata: metaDoc },
        registeredAt: new Date("2026-07-09T12:00:00Z"),
      },
    ];

    const result = await getPlayedTournaments("0xPlayer");

    expect(result).toHaveLength(1);
    expect(result[0].tournament.address).toBe(tournamentA.address);
    expect(result[0].metadata).toEqual(metaDoc);
    expect(result[0].registeredAt).toEqual(new Date("2026-07-09T12:00:00Z"));
  });

  it("returns null metadata when no metadata row exists", async () => {
    fakeRows.rows = [
      {
        tournament: tournamentB,
        metadata: null,
        registeredAt: new Date("2026-07-08T10:00:00Z"),
      },
    ];

    const result = await getPlayedTournaments("0xPlayer");

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toBeNull();
  });

  it("returns an empty array when the address has no registrations", async () => {
    fakeRows.rows = [];

    const result = await getPlayedTournaments("0xNoOne");

    expect(result).toEqual([]);
  });

  it("preserves the order from the query (newest-first)", async () => {
    fakeRows.rows = [
      {
        tournament: tournamentB,
        metadata: null,
        registeredAt: new Date("2026-07-10T00:00:00Z"),
      },
      {
        tournament: tournamentA,
        metadata: null,
        registeredAt: new Date("2026-07-08T00:00:00Z"),
      },
    ];

    const result = await getPlayedTournaments("0xPlayer");

    expect(result).toHaveLength(2);
    expect(result[0].tournament.address).toBe(tournamentB.address);
    expect(result[1].tournament.address).toBe(tournamentA.address);
  });
});
