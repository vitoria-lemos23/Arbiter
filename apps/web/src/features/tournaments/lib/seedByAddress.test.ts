import type { Match } from "@arbiter/db";
import { describe, expect, it } from "vitest";
import { seedByAddress } from "./seedByAddress";

function leaf(overrides: Partial<Match>): Match {
  return {
    id: "t-1",
    tournament: "0xt",
    matchIndex: 1,
    round: 1,
    playerA: null,
    playerB: null,
    seedA: null,
    seedB: null,
    winner: null,
    status: 1,
    blockNumber: "0",
    txHash: "0x",
    generatedAt: new Date(0),
    ...overrides,
  };
}

describe("seedByAddress", () => {
  it("maps seeded leaf players (lowercased) to their seed", () => {
    const map = seedByAddress([
      leaf({ playerA: "0xAAaa", playerB: "0xBBbb", seedA: 1, seedB: 8 }),
    ]);
    expect(map).toEqual({ "0xaaaa": 1, "0xbbbb": 8 });
  });

  it("ignores TBD slots and unseeded internal nodes", () => {
    const map = seedByAddress([
      leaf({ matchIndex: 0, round: 2, playerA: "0xCCcc", seedA: null }),
      leaf({ playerA: null, playerB: null }),
    ]);
    expect(map).toEqual({});
  });
});
