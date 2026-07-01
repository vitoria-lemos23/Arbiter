import { parseEther, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import {
  createTournamentSchema,
  prizeWei,
  toTournamentParams,
} from "./createTournament";

// A far-future / valid baseline the individual cases override per assertion.
function base(overrides: Record<string, unknown> = {}) {
  const inOneHour = new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);
  const inTwoHours = new Date(Date.now() + 7_200_000)
    .toISOString()
    .slice(0, 16);
  return {
    name: "Spring Cup",
    format: "0",
    maxPlayers: "8",
    startDate: inOneHour,
    endDate: inTwoHours,
    prize: "1.5",
    entryFee: "0.1",
    judges: "",
    ...overrides,
  };
}

describe("createTournamentSchema", () => {
  it("accepts a well-formed tournament", () => {
    expect(createTournamentSchema.safeParse(base()).success).toBe(true);
  });

  it("requires a name", () => {
    const result = createTournamentSchema.safeParse(base({ name: "  " }));
    expect(result.success).toBe(false);
  });

  it("rejects a non power-of-two capacity", () => {
    expect(
      createTournamentSchema.safeParse(base({ maxPlayers: "6" })).success,
    ).toBe(false);
  });

  it("rejects fewer than 2 players", () => {
    expect(
      createTournamentSchema.safeParse(base({ maxPlayers: "1" })).success,
    ).toBe(false);
  });

  it("accepts every offered power-of-two capacity", () => {
    for (const n of [2, 4, 8, 16, 32, 64, 128]) {
      expect(
        createTournamentSchema.safeParse(base({ maxPlayers: String(n) }))
          .success,
      ).toBe(true);
    }
  });

  it("rejects a start date in the past", () => {
    const past = new Date(Date.now() - 3_600_000).toISOString().slice(0, 16);
    const result = createTournamentSchema.safeParse(base({ startDate: past }));
    expect(result.success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const start = new Date(Date.now() + 7_200_000).toISOString().slice(0, 16);
    const end = new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);
    const result = createTournamentSchema.safeParse(
      base({ startDate: start, endDate: end }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a malformed judge address", () => {
    expect(
      createTournamentSchema.safeParse(base({ judges: "0xnope" })).success,
    ).toBe(false);
  });

  it("rejects the zero judge address", () => {
    expect(
      createTournamentSchema.safeParse(base({ judges: zeroAddress })).success,
    ).toBe(false);
  });

  it("rejects duplicate judges", () => {
    const addr = `0x${"a".repeat(40)}`;
    expect(
      createTournamentSchema.safeParse(base({ judges: `${addr}, ${addr}` }))
        .success,
    ).toBe(false);
  });

  it("parses a list of distinct judges", () => {
    const a = `0x${"a".repeat(40)}`;
    const b = `0x${"b".repeat(40)}`;
    const result = createTournamentSchema.safeParse(
      base({ judges: `${a}\n${b}` }),
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.judges).toHaveLength(2);
  });

  it("rejects a negative prize", () => {
    expect(
      createTournamentSchema.safeParse(base({ prize: "-1" })).success,
    ).toBe(false);
  });

  it("allows a zero prize", () => {
    expect(createTournamentSchema.safeParse(base({ prize: "0" })).success).toBe(
      true,
    );
  });
});

describe("conversion helpers", () => {
  it("converts fee and prize ETH strings to wei", () => {
    const parsed = createTournamentSchema.parse(
      base({ prize: "2", entryFee: "0.5" }),
    );
    expect(prizeWei(parsed)).toBe(parseEther("2"));
    expect(toTournamentParams(parsed).entryFee).toBe(parseEther("0.5"));
  });

  it("converts the datetimes to unix seconds and format to 0", () => {
    const start = new Date(Date.now() + 3_600_000);
    const parsed = createTournamentSchema.parse(
      base({ startDate: start.toISOString().slice(0, 16) }),
    );
    const params = toTournamentParams(parsed);
    expect(params.format).toBe(0);
    expect(params.startDate).toBe(
      BigInt(
        Math.floor(new Date(start.toISOString().slice(0, 16)).getTime() / 1000),
      ),
    );
  });

  it("checksums judge addresses in the params", () => {
    const a = `0x${"a".repeat(40)}`;
    const parsed = createTournamentSchema.parse(base({ judges: a }));
    expect(toTournamentParams(parsed).judges[0]).not.toBe(a); // checksummed
  });
});
