import { beforeEach, describe, expect, it, vi } from "vitest";

/** Chainable fake resolving to roster rows (ordered) or a count row. */
const fake = vi.hoisted(() => {
  class FakeRegistrationDb {
    rows: unknown[] = [];
    countValue = 0;
    lastWhere: unknown = null;
    private ordered = false;

    select() {
      this.ordered = false;
      return this;
    }
    from() {
      return this;
    }
    where(condition: unknown) {
      this.lastWhere = condition;
      return this;
    }
    orderBy() {
      this.ordered = true;
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      const out = this.ordered ? this.rows : [{ value: this.countValue }];
      return Promise.resolve(out).then(resolve, reject);
    }
  }
  return { db: new FakeRegistrationDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  registration: { tournament: {}, position: {} },
}));
vi.mock("drizzle-orm", () => ({
  eq: (_column: unknown, value: unknown) => ({ value }),
  asc: () => ({}),
  count: () => ({}),
}));

const { listRegistrations, countRegistrations } = await import(
  "./getRegistrations"
);

const TOURNAMENT = "0xC6977d7E5603100fd28363110dEf8276004d3981";

beforeEach(() => {
  fake.db.rows = [];
  fake.db.countValue = 0;
  fake.db.lastWhere = null;
});

describe("listRegistrations", () => {
  it("returns the ordered roster rows", async () => {
    const roster = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
    ];
    fake.db.rows = roster;
    expect(await listRegistrations(TOURNAMENT)).toEqual(roster);
  });

  it("matches on the lowercased tournament address", async () => {
    await listRegistrations(TOURNAMENT);
    expect(fake.db.lastWhere).toEqual({ value: TOURNAMENT.toLowerCase() });
  });
});

describe("countRegistrations", () => {
  it("returns the row count for the lowercased address", async () => {
    fake.db.countValue = 5;
    expect(await countRegistrations(TOURNAMENT)).toBe(5);
    expect(fake.db.lastWhere).toEqual({ value: TOURNAMENT.toLowerCase() });
  });
});
