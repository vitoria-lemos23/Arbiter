import { beforeEach, describe, expect, it, vi } from "vitest";

/** Chainable fake resolving to joined rows (list) or a count row. */
const fake = vi.hoisted(() => {
  class FakeListDb {
    rows: unknown[] = [];
    countValue = 0;
    lastLimit = 0;
    lastOffset = 0;
    private joined = false;

    select() {
      this.joined = false;
      return this;
    }
    from() {
      return this;
    }
    leftJoin() {
      this.joined = true;
      return this;
    }
    orderBy() {
      return this;
    }
    limit(n: number) {
      this.lastLimit = n;
      return this;
    }
    offset(m: number) {
      this.lastOffset = m;
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      const out = this.joined ? this.rows : [{ value: this.countValue }];
      return Promise.resolve(out).then(resolve, reject);
    }
  }
  return { db: new FakeListDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  tournament: { address: {}, organizer: {}, createdAt: {}, index: {} },
  tournamentMetadata: { tournamentAddress: {}, ownerAddress: {} },
}));
vi.mock("drizzle-orm", () => ({
  eq: () => ({}),
  sql: () => ({}),
  desc: () => ({}),
  count: () => ({}),
}));

const { listTournamentsWithMetadata, countTournaments } = await import(
  "./listTournaments"
);

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
});

describe("listTournamentsWithMetadata", () => {
  it("keeps metadata when ownerAddress matches the on-chain organizer", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER, { ownerAddress: ORGANIZER, metadata: doc }),
    ];
    const [item] = await listTournamentsWithMetadata({ page: 1, pageSize: 12 });
    expect(item.metadata).toEqual(doc);
  });

  it("matches organizer/owner case-insensitively", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER.toUpperCase(), {
        ownerAddress: ORGANIZER,
        metadata: doc,
      }),
    ];
    const [item] = await listTournamentsWithMetadata({ page: 1, pageSize: 12 });
    expect(item.metadata).toEqual(doc);
  });

  it("drops metadata when ownerAddress does not match the organizer (Rule #5)", async () => {
    fake.db.rows = [
      chainRow(ORGANIZER, { ownerAddress: "0xdead", metadata: doc }),
    ];
    const [item] = await listTournamentsWithMetadata({ page: 1, pageSize: 12 });
    expect(item.metadata).toBeNull();
  });

  it("keeps tournaments that have no metadata row (left join)", async () => {
    fake.db.rows = [chainRow(ORGANIZER, null)];
    const [item] = await listTournamentsWithMetadata({ page: 1, pageSize: 12 });
    expect(item.metadata).toBeNull();
    expect(item.tournament.address).toBe("0xt");
  });

  it("applies limit and offset from page/pageSize", async () => {
    await listTournamentsWithMetadata({ page: 3, pageSize: 12 });
    expect(fake.db.lastLimit).toBe(12);
    expect(fake.db.lastOffset).toBe(24);
  });
});

describe("countTournaments", () => {
  it("returns the row count", async () => {
    fake.db.countValue = 42;
    expect(await countTournaments()).toBe(42);
  });
});
