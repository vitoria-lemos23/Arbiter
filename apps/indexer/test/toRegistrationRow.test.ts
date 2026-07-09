import { describe, expect, it } from "vitest";
import {
  type PlayerRegisteredEvent,
  toRegistrationRow,
} from "../src/toRegistrationRow";

// A representative PlayerRegistered log: the second player of a paid bracket.
// Addresses are checksummed on purpose — the row must lowercase them.
const fixture: PlayerRegisteredEvent = {
  args: {
    player: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    position: 1,
    entryFeePaid: 1_000_000_000_000_000_000n, // 1 ETH in wei
  },
  log: { address: "0xc6977d7E5603100fd28363110dEf8276004d3981" },
  block: { number: 42n, timestamp: 1_799_990_000n },
  transaction: {
    hash: "0xabc0000000000000000000000000000000000000000000000000000000000002",
  },
};

describe("toRegistrationRow", () => {
  it("decodes every field, keyed by lowercased tournament and player", () => {
    const row = toRegistrationRow(fixture);
    expect(row).toEqual({
      id: "0xc6977d7e5603100fd28363110def8276004d3981-0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      tournament: "0xc6977d7e5603100fd28363110def8276004d3981",
      player: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      position: 1,
      entryFeePaid: 1_000_000_000_000_000_000n,
      blockNumber: 42n,
      txHash:
        "0xabc0000000000000000000000000000000000000000000000000000000000002",
      registeredAt: new Date(1_799_990_000_000),
    });
  });

  it("preserves full uint256 wei values without precision loss", () => {
    const huge = 123_456_789_012_345_678_901_234_567_890n;
    const row = toRegistrationRow({
      ...fixture,
      args: { ...fixture.args, entryFeePaid: huge },
    });
    expect(row.entryFeePaid).toBe(huge);
  });

  it("records a free registration as zero wei paid", () => {
    const row = toRegistrationRow({
      ...fixture,
      args: { ...fixture.args, entryFeePaid: 0n },
    });
    expect(row.entryFeePaid).toBe(0n);
  });
});
