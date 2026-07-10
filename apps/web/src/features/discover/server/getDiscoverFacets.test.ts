import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => {
  class FakeFacetsDb {
    gameRows: { game: string | null }[] = [];
    prizeRow: { min: string | null; max: string | null } = {
      min: null,
      max: null,
    };
    private mode = "games";

    selectDistinct() {
      this.mode = "games";
      return this;
    }
    select() {
      this.mode = "prize";
      return this;
    }
    from() {
      return this;
    }
    leftJoin() {
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      const out = this.mode === "prize" ? [this.prizeRow] : this.gameRows;
      return Promise.resolve(out).then(resolve, reject);
    }
  }
  return { db: new FakeFacetsDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  tournament: { address: {}, organizer: {}, prize: {} },
  tournamentMetadata: { tournamentAddress: {}, ownerAddress: {}, metadata: {} },
}));
vi.mock("drizzle-orm", () => {
  const sql = () => ({});
  sql.raw = () => ({});
  return {
    sql,
    and: () => ({}),
    eq: () => ({}),
    min: () => ({}),
    max: () => ({}),
  };
});

const { getDiscoverFacets } = await import("./getDiscoverFacets");

beforeEach(() => {
  fake.db.gameRows = [];
  fake.db.prizeRow = { min: null, max: null };
});

describe("getDiscoverFacets", () => {
  it("returns sorted, de-nulled distinct games", async () => {
    fake.db.gameRows = [{ game: "Smash" }, { game: null }, { game: "Chess" }];
    const { games } = await getDiscoverFacets();
    expect(games).toEqual(["Chess", "Smash"]);
  });

  it("returns the prize bounds in wei", async () => {
    fake.db.prizeRow = { min: "100", max: "9000" };
    const { minPrizeWei, maxPrizeWei } = await getDiscoverFacets();
    expect(minPrizeWei).toBe("100");
    expect(maxPrizeWei).toBe("9000");
  });

  it("defaults prize bounds to zero on an empty database", async () => {
    const { games, minPrizeWei, maxPrizeWei } = await getDiscoverFacets();
    expect(games).toEqual([]);
    expect(minPrizeWei).toBe("0");
    expect(maxPrizeWei).toBe("0");
  });
});
