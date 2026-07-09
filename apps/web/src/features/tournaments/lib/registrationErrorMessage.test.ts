import { tournamentAbi } from "@arbiter/contracts";
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeErrorResult,
  type Hex,
} from "viem";
import { describe, expect, it } from "vitest";
import { registrationErrorMessage } from "./registrationErrorMessage";

/** A viem error chain as produced by a reverted `register()` write/simulate. */
function revertError(data: Hex): BaseError {
  const cause = new ContractFunctionRevertedError({
    abi: tournamentAbi,
    data,
    functionName: "register",
  });
  return new BaseError("Execution reverted.", { cause });
}

describe("registrationErrorMessage", () => {
  it("returns null for no error", () => {
    expect(registrationErrorMessage(null)).toBeNull();
    expect(registrationErrorMessage(undefined)).toBeNull();
  });

  // Each case pre-encodes its revert data with a literal errorName so viem
  // fully type-checks the args tuple (no casts).
  const cases: [string, Hex, string][] = [
    [
      "TournamentFull",
      encodeErrorResult({
        abi: tournamentAbi,
        errorName: "TournamentFull",
        args: [8],
      }),
      "This tournament is full.",
    ],
    [
      "AlreadyRegistered",
      encodeErrorResult({
        abi: tournamentAbi,
        errorName: "AlreadyRegistered",
        args: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
      }),
      "This wallet is already registered.",
    ],
    [
      "RegistrationClosed",
      encodeErrorResult({
        abi: tournamentAbi,
        errorName: "RegistrationClosed",
        args: [BigInt(2000), BigInt(2000)],
      }),
      "Registration closed before your transaction was mined.",
    ],
    [
      "IncorrectEntryFee",
      encodeErrorResult({
        abi: tournamentAbi,
        errorName: "IncorrectEntryFee",
        args: [BigInt(1), BigInt(2)],
      }),
      "The transaction did not include the exact entry fee. Please try again.",
    ],
  ];
  it.each(cases)("decodes the %s custom error", (_name, data, expected) => {
    expect(registrationErrorMessage(revertError(data))).toBe(expected);
  });

  it("falls back to viem's shortMessage for other BaseErrors", () => {
    const error = new BaseError("User rejected the request.");
    expect(registrationErrorMessage(error)).toBe("User rejected the request.");
  });

  it("falls back to message/String for non-viem errors", () => {
    expect(registrationErrorMessage(new Error("boom"))).toBe("boom");
    expect(registrationErrorMessage("boom")).toBe("boom");
  });
});
