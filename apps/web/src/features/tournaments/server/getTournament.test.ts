import { beforeEach, describe, expect, it, vi } from "vitest";

/** Chainable fake resolving to the joined single-row query. */
const fake = vi.hoisted(() => {
  class FakeGetDb {
    rows: unknown[] = [];
    lastLimit = 0;

    select() {
      return this;
    }
    from() {
      return this;
    }
    leftJoin() {
      return this;
    }
    where() {
      return this;
    }
    limit(n: number) {
      this.lastLimit = n;
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      return Promise.resolve(this.rows).then(resolve, reject);
    }
  }
  return { db: new FakeGetDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  tournament: { address: {}, organizer: {} },
  tournamentMetadata: { tournamentAddress: {} },
}));
vi.mock("drizzle-orm", () => ({
  eq: () => ({}),
  sql: () => ({}),
}));

const { getTournamentWithMetadata } = await import("./getTournament");

const ORGANIZER = "0xabc0000000000000000000000000000000000001";
const ADDRESS = "0xAbC0000000000000000000000000000000000009";
const doc = { name: "Clash", tags: [] };

function chainRow(organizer: string, metadata: unknown) {
  return {
    tournament: { address: ADDRESS, organizer, format: 0, maxPlayers: 8 },
    metadata,
  };
}

beforeEach(() => {
  fake.db.rows = [];
});

describe("getTournamentWithMetadata", () => {
  it("returns the reconciled row for an indexed address", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER, { ownerAddress: ORGANIZER, metadata: doc }),
    ];
    const item = await getTournamentWithMetadata(ADDRESS);
    expect(item?.tournament.address).toBe(ADDRESS);
    expect(item?.metadata).toEqual(doc);
    expect(fake.db.lastLimit).toBe(1);
  });

  it("returns null for an address that is not indexed", async () => {
    fake.db.rows = [];
    expect(await getTournamentWithMetadata(ADDRESS)).toBeNull();
  });

  it("drops metadata whose ownerAddress differs from the organizer", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER, {
        ownerAddress: "0xdead000000000000000000000000000000000000",
        metadata: doc,
      }),
    ];
    const item = await getTournamentWithMetadata(ADDRESS);
    expect(item?.metadata).toBeNull();
  });
});
