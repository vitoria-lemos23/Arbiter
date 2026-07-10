import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseDiscoverQuery } from "../schema/discoverQuery";

/**
 * Named fake for the Drizzle query chain. drizzle-orm operators are mocked to
 * inert values, so these tests cover the app-layer behaviour of
 * `queryDiscoverTournaments` (reconcile, limit sizing, list slicing, hasMore,
 * total) rather than the generated SQL — the predicate composition is exercised
 * by `pnpm build` and manual verification (spec 010).
 */
const fake = vi.hoisted(() => {
  class FakeDiscoverDb {
    rows: unknown[] = [];
    countValue = 0;
    lastLimit = 0;
    private mode = "rows";

    select(projection: Record<string, unknown>) {
      this.mode = "value" in projection ? "count" : "rows";
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
    orderBy() {
      return this;
    }
    limit(n: number) {
      this.lastLimit = n;
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      const out =
        this.mode === "count" ? [{ value: this.countValue }] : this.rows;
      return Promise.resolve(out).then(resolve, reject);
    }
  }
  return { db: new FakeDiscoverDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  tournament: {
    address: {},
    organizer: {},
    index: {},
    format: {},
    prize: {},
    startDate: {},
    endDate: {},
    createdAt: {},
  },
  tournamentMetadata: { tournamentAddress: {}, ownerAddress: {}, metadata: {} },
}));
vi.mock("drizzle-orm", () => {
  const sql = () => ({});
  sql.raw = () => ({});
  return {
    sql,
    and: () => ({}),
    or: () => ({}),
    asc: () => ({}),
    desc: () => ({}),
    eq: () => ({}),
    gte: () => ({}),
    lte: () => ({}),
    ilike: () => ({}),
    inArray: () => ({}),
    count: () => ({}),
  };
});

const { queryDiscoverTournaments } = await import("./queryDiscoverTournaments");

const ORGANIZER = "0xabc0000000000000000000000000000000000001";
const doc = { name: "Clash", tags: [] };

function chainRow(organizer: string, metadata: unknown) {
  return {
    tournament: { address: "0xt", organizer, format: 0, maxPlayers: 8 },
    metadata,
  };
}

beforeEach(() => {
  fake.db.rows = [];
  fake.db.countValue = 0;
});

describe("queryDiscoverTournaments", () => {
  it("keeps metadata whose owner matches the organizer", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER, { ownerAddress: ORGANIZER, metadata: doc }),
    ];
    const { items } = await queryDiscoverTournaments(parseDiscoverQuery({}));
    expect(items[0]?.metadata).toEqual(doc);
  });

  it("drops metadata whose owner does not match the organizer", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER, { ownerAddress: "0xdead", metadata: doc }),
    ];
    const { items } = await queryDiscoverTournaments(parseDiscoverQuery({}));
    expect(items[0]?.metadata).toBeNull();
  });

  it("fetches CARDS_COUNT + show + 1 rows", async () => {
    await queryDiscoverTournaments(parseDiscoverQuery({ show: "12" }));
    // CARDS_COUNT (3) + show (12) + 1 sentinel row.
    expect(fake.db.lastLimit).toBe(16);
  });

  it("flags hasMore and trims the sentinel row when the window overflows", async () => {
    // Default show = 6 -> visible = 9; return 10 rows (one past the window).
    fake.db.rows = Array.from({ length: 10 }, () => chainRow(ORGANIZER, null));
    const { items, hasMore } = await queryDiscoverTournaments(
      parseDiscoverQuery({}),
    );
    expect(hasMore).toBe(true);
    expect(items).toHaveLength(9);
  });

  it("does not flag hasMore when the window is not full", async () => {
    fake.db.rows = Array.from({ length: 4 }, () => chainRow(ORGANIZER, null));
    const { items, hasMore } = await queryDiscoverTournaments(
      parseDiscoverQuery({}),
    );
    expect(hasMore).toBe(false);
    expect(items).toHaveLength(4);
  });

  it("returns the matching total from count()", async () => {
    fake.db.countValue = 7;
    const { total } = await queryDiscoverTournaments(parseDiscoverQuery({}));
    expect(total).toBe(7);
  });
});
