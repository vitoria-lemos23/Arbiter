import { describe, expect, it } from "vitest";
import { cloneInitCode, predictCloneAddress } from "./predictCloneAddress";

// Concrete vector captured from the canonical on-chain
// `TournamentFactory.predictTournamentAddress` (hardhat, deterministic deploy
// addresses). Regenerate with `scripts/create2-vector.ts` in @arbiter/contracts.
// This proves the client-side CREATE2 derivation matches the contract byte for
// byte — a mismatch would mean the form logs/keys the wrong address.
const VECTOR = {
  implementation: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  factory: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
  salt: "0x000000000000000000000000000000000000000000000000000000000000002a",
  predicted: "0xc6977d7E5603100fd28363110dEf8276004d3981",
} as const;

describe("predictCloneAddress", () => {
  it("matches the on-chain predictTournamentAddress for a known vector", () => {
    expect(
      predictCloneAddress({
        implementation: VECTOR.implementation,
        factory: VECTOR.factory,
        salt: VECTOR.salt,
      }),
    ).toBe(VECTOR.predicted);
  });

  it("changes the address when the salt changes", () => {
    const other = predictCloneAddress({
      implementation: VECTOR.implementation,
      factory: VECTOR.factory,
      salt: "0x000000000000000000000000000000000000000000000000000000000000002b",
    });
    expect(other).not.toBe(VECTOR.predicted);
  });
});

describe("cloneInitCode", () => {
  it("embeds the implementation address in the EIP-1167 minimal proxy", () => {
    const code = cloneInitCode(VECTOR.implementation);
    expect(code).toBe(
      "0x3d602d80600a3d3981f3363d3d373d3d3d363d735fbdb2315678afecb367f032d93f642f64180aa35af43d82803e903d91602b57fd5bf3",
    );
  });
});
