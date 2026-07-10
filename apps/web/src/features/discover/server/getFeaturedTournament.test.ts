import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => {
  class FakeFeaturedDb {
    rows: unknown[] = [];
    select() {
      return this;
    }
    from() {
      return this;
    }
    leftJoin() {
      return this;
    }
    orderBy() {
      return this;
    }
    limit() {
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      return Promise.resolve(this.rows).then(resolve, reject);
    }
  }
  return { db: new FakeFeaturedDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  tournament: { address: {}, organizer: {}, index: {}, createdAt: {} },
  tournamentMetadata: { tournamentAddress: {}, ownerAddress: {}, metadata: {} },
}));
vi.mock("drizzle-orm", () => {
  const sql = () => ({});
  sql.raw = () => ({});
  return { sql, and: () => ({}), eq: () => ({}), desc: () => ({}) };
});

const { getFeaturedTournament } = await import("./getFeaturedTournament");

const ORGANIZER = "0xabc0000000000000000000000000000000000001";
const doc = { name: "Clash", tags: [] };

beforeEach(() => {
  fake.db.rows = [];
});

describe("getFeaturedTournament", () => {
  it("returns null when no tournaments are indexed", async () => {
    expect(await getFeaturedTournament()).toBeNull();
  });

  it("returns the latest row with trusted metadata", async () => {
    fake.db.rows = [
      {
        tournament: { address: "0xt", organizer: ORGANIZER },
        metadata: { ownerAddress: ORGANIZER, metadata: doc },
      },
    ];
    const featured = await getFeaturedTournament();
    expect(featured?.tournament.address).toBe("0xt");
    expect(featured?.metadata).toEqual(doc);
  });

  it("nulls metadata when the owner does not match the organizer", async () => {
    fake.db.rows = [
      {
        tournament: { address: "0xt", organizer: ORGANIZER },
        metadata: { ownerAddress: "0xdead", metadata: doc },
      },
    ];
    const featured = await getFeaturedTournament();
    expect(featured?.metadata).toBeNull();
  });
});
