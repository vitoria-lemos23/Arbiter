import { describe, expect, it } from "vitest";
import { toVoteRow, type VoteCastEvent } from "../src/toVoteRow";

// A representative VoteCast log: a judge voting on match index 3.
// Addresses are checksummed on purpose — the row must lowercase them.
const fixture: VoteCastEvent = {
  args: {
    matchIndex: 3n,
    judge: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    votedFor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  log: { address: "0xc6977d7E5603100fd28363110dEf8276004d3981" },
  block: { number: 51n, timestamp: 1_799_995_000n },
  transaction: {
    hash: "0xabc0000000000000000000000000000000000000000000000000000000000003",
  },
};

describe("toVoteRow", () => {
  it("decodes every field, keyed by tournament, match index, and judge", () => {
    const row = toVoteRow(fixture);
    expect(row).toEqual({
      id: "0xc6977d7e5603100fd28363110def8276004d3981-3-0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      tournament: "0xc6977d7e5603100fd28363110def8276004d3981",
      matchIndex: 3,
      judge: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      votedFor: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      blockNumber: 51n,
      txHash:
        "0xabc0000000000000000000000000000000000000000000000000000000000003",
      votedAt: new Date(1_799_995_000_000),
    });
  });

  it("narrows the uint256 match index to a JS number", () => {
    const row = toVoteRow({
      ...fixture,
      args: { ...fixture.args, matchIndex: 0n },
    });
    expect(row.matchIndex).toBe(0);
    expect(
      row.id.endsWith("-0-0x70997970c51812dc3a010c7d01b50e0d17dc79c8"),
    ).toBe(true);
  });
});
