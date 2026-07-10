import { describe, expect, it } from "vitest";
import { type JudgeAssignedEvent, toJudgeRow } from "../src/toJudgeRow";

// A representative JudgeAssigned log. Both addresses are checksummed on purpose
// — the row must lowercase them (and the id derives from the args, not
// `log.address`, since the event carries the tournament explicitly).
const fixture: JudgeAssignedEvent = {
  args: {
    tournament: "0xc6977d7E5603100fd28363110dEf8276004d3981",
    judge: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  block: { number: 7n, timestamp: 1_799_990_000n },
  transaction: {
    hash: "0xabc0000000000000000000000000000000000000000000000000000000000009",
  },
};

describe("toJudgeRow", () => {
  it("decodes every field, keyed by lowercased tournament and judge", () => {
    const row = toJudgeRow(fixture);
    expect(row).toEqual({
      id: "0xc6977d7e5603100fd28363110def8276004d3981-0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      tournament: "0xc6977d7e5603100fd28363110def8276004d3981",
      judge: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      blockNumber: 7n,
      txHash:
        "0xabc0000000000000000000000000000000000000000000000000000000000009",
      assignedAt: new Date(1_799_990_000_000),
    });
  });

  it("derives the id from the args tournament, independent of the emitter", () => {
    const row = toJudgeRow(fixture);
    // Same tournament + judge always collapse to one row (idempotent re-index).
    expect(row.id).toBe(`${row.tournament}-${row.judge}`);
  });
});
