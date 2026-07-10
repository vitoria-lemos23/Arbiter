import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake for the Drizzle query chain. The three role queries run concurrently
 * (`Promise.all`), so — like real Drizzle — each `.select()` must return an
 * INDEPENDENT builder; a single shared, mutable chain would let the last
 * `.from()` clobber the others before any `.then` resolves. Each builder keys
 * its canned rows by the table sentinel handed to `.from()`.
 */
const h = vi.hoisted(() => {
  const tournament = { __t: "tournament", address: {}, organizer: {} };
  const registration = { __t: "registration", tournament: {}, player: {} };
  const judge = { __t: "judge", tournament: {}, judge: {} };
  const tournamentMetadata = { __t: "metadata", tournamentAddress: {} };

  const store = {
    rowsByTable: new Map<unknown, unknown[]>(),
    lastWhere: null as unknown,
  };

  class QueryBuilder {
    current: unknown = null;
    from(table: unknown) {
      this.current = table;
      return this;
    }
    innerJoin() {
      return this;
    }
    leftJoin() {
      return this;
    }
    where(condition: unknown) {
      store.lastWhere = condition;
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      const rows = store.rowsByTable.get(this.current) ?? [];
      return Promise.resolve(rows).then(resolve, reject);
    }
  }

  const db = { select: () => new QueryBuilder() };

  return { tournament, registration, judge, tournamentMetadata, db, store };
});

vi.mock("@arbiter/db", () => ({
  db: h.db,
  tournament: h.tournament,
  registration: h.registration,
  judge: h.judge,
  tournamentMetadata: h.tournamentMetadata,
}));
vi.mock("drizzle-orm", () => ({
  eq: (_column: unknown, value: unknown) => ({ value }),
  sql: () => ({}),
}));

const { listMyTournaments } = await import("./listMyTournaments");

const WALLET = "0xC6977d7E5603100fd28363110dEf8276004d3981";
const ADDR_A = "0xAAA0000000000000000000000000000000000001";
const ADDR_B = "0xBbB0000000000000000000000000000000000002";

/** Minimal `tournament` row — only fields the action reads. */
function makeTournament(address: string, createdAt: Date) {
  return {
    address,
    organizer: WALLET,
    createdAt,
  };
}

function setRows(role: "organizer" | "judge" | "player", rows: unknown[]) {
  const table =
    role === "organizer"
      ? h.tournament
      : role === "judge"
        ? h.judge
        : h.registration;
  h.store.rowsByTable.set(table, rows);
}

beforeEach(() => {
  h.store.rowsByTable.clear();
  h.store.lastWhere = null;
});

describe("listMyTournaments", () => {
  it("returns organizer tournaments with the organizer role", async () => {
    setRows("organizer", [
      { tournament: makeTournament(ADDR_A, new Date(2000)), metadata: null },
    ]);
    const result = await listMyTournaments(WALLET);
    expect(result).toHaveLength(1);
    expect(result[0]?.tournament.address).toBe(ADDR_A);
    expect(result[0]?.roles).toEqual(["organizer"]);
  });

  it("returns registered tournaments with the player role", async () => {
    setRows("player", [
      { tournament: makeTournament(ADDR_A, new Date(2000)), metadata: null },
    ]);
    const result = await listMyTournaments(WALLET);
    expect(result[0]?.roles).toEqual(["player"]);
  });

  it("returns judged tournaments with the judge role", async () => {
    setRows("judge", [
      { tournament: makeTournament(ADDR_A, new Date(2000)), metadata: null },
    ]);
    const result = await listMyTournaments(WALLET);
    expect(result[0]?.roles).toEqual(["judge"]);
  });

  it("deduplicates a multi-role tournament into one card with all roles", async () => {
    const row = {
      tournament: makeTournament(ADDR_A, new Date(2000)),
      metadata: null,
    };
    setRows("organizer", [row]);
    setRows("player", [row]);
    const result = await listMyTournaments(WALLET);
    expect(result).toHaveLength(1);
    // Merge order fixes the badge order: organizer before player.
    expect(result[0]?.roles).toEqual(["organizer", "player"]);
  });

  it("returns an empty list when the wallet has no involvement", async () => {
    expect(await listMyTournaments(WALLET)).toEqual([]);
  });

  it("discards metadata whose owner mismatches the on-chain organizer", async () => {
    setRows("organizer", [
      {
        tournament: makeTournament(ADDR_A, new Date(2000)),
        metadata: {
          ownerAddress: "0xdeadbeef00000000000000000000000000000000",
          metadata: { name: "Spoofed", tags: [] },
        },
      },
    ]);
    const result = await listMyTournaments(WALLET);
    expect(result[0]?.metadata).toBeNull();
    expect(result[0]?.tournament.address).toBe(ADDR_A);
  });

  it("keeps metadata whose owner matches the on-chain organizer", async () => {
    const doc = { name: "Real Cup", tags: ["fps"] };
    setRows("organizer", [
      {
        tournament: makeTournament(ADDR_A, new Date(2000)),
        metadata: { ownerAddress: WALLET, metadata: doc },
      },
    ]);
    const result = await listMyTournaments(WALLET);
    expect(result[0]?.metadata).toEqual(doc);
  });

  it("sorts results by createdAt descending (newest first)", async () => {
    setRows("organizer", [
      { tournament: makeTournament(ADDR_A, new Date(1000)), metadata: null },
      { tournament: makeTournament(ADDR_B, new Date(9000)), metadata: null },
    ]);
    const result = await listMyTournaments(WALLET);
    expect(result.map((r) => r.tournament.address)).toEqual([ADDR_B, ADDR_A]);
  });

  it("lowercases the wallet address before querying", async () => {
    await listMyTournaments(WALLET);
    // The last query built is the player lookup: eq(registration.player, wallet).
    expect(h.store.lastWhere).toEqual({ value: WALLET.toLowerCase() });
  });
});
