import { describe, expect, it } from "vitest";
import {
  type TournamentCreatedEvent,
  toTournamentRow,
} from "../src/toTournamentRow";

// A representative TournamentCreated log: a paid, 8-player single-elim bracket.
const fixture: TournamentCreatedEvent = {
  args: {
    tournament: "0xc6977d7E5603100fd28363110dEf8276004d3981",
    organizer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    index: 3n,
    format: 0,
    maxPlayers: 8,
    entryFee: 1_000_000_000_000_000_000n, // 1 ETH in wei
    prize: 2_000_000_000_000_000_000n, // 2 ETH in wei
    startDate: 1_800_000_000n, // unix seconds
    endDate: 1_800_003_600n,
  },
  block: { number: 42n, timestamp: 1_799_990_000n },
  transaction: {
    hash: "0xabc0000000000000000000000000000000000000000000000000000000000001",
  },
};

describe("toTournamentRow", () => {
  it("decodes every field from the event and log context", () => {
    const row = toTournamentRow(fixture);
    expect(row).toEqual({
      address: "0xc6977d7E5603100fd28363110dEf8276004d3981",
      organizer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      index: 3n,
      format: 0,
      maxPlayers: 8,
      entryFee: 1_000_000_000_000_000_000n,
      prize: 2_000_000_000_000_000_000n,
      startDate: new Date(1_800_000_000_000),
      endDate: new Date(1_800_003_600_000),
      blockNumber: 42n,
      txHash:
        "0xabc0000000000000000000000000000000000000000000000000000000000001",
      createdAt: new Date(1_799_990_000_000),
    });
  });

  it("preserves full uint256 wei values without precision loss", () => {
    const huge = 123_456_789_012_345_678_901_234_567_890n;
    const row = toTournamentRow({
      ...fixture,
      args: { ...fixture.args, prize: huge, entryFee: huge },
    });
    expect(row.prize).toBe(huge);
    expect(row.entryFee).toBe(huge);
  });
});
