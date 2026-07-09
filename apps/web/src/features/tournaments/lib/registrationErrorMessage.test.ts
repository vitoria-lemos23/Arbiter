import { tournamentAbi } from "@arbiter/contracts";
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeErrorResult,
} from "viem";
import { describe, expect, it } from "vitest";
import { registrationErrorMessage } from "./registrationErrorMessage";

type RegisterErrorName =
  | "TournamentFull"
  | "AlreadyRegistered"
  | "RegistrationClosed"
  | "IncorrectEntryFee";

/** A viem error chain as produced by a reverted `register()` write/simulate. */
function revertError(errorName: RegisterErrorName, args: unknown[]): BaseError {
  const data = encodeErrorResult({
    abi: tournamentAbi,
    errorName,
    // biome-ignore lint/suspicious/noExplicitAny: fixture builder covers several error shapes
    args: args as any,
  });
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

  const cases: [RegisterErrorName, unknown[], string][] = [
    ["TournamentFull", [8], "This tournament is full."],
    [
      "AlreadyRegistered",
      ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
      "This wallet is already registered.",
    ],
    [
      "RegistrationClosed",
      [BigInt(2000), BigInt(2000)],
      "Registration closed before your transaction was mined.",
    ],
    [
      "IncorrectEntryFee",
      [BigInt(1), BigInt(2)],
      "The transaction did not include the exact entry fee. Please try again.",
    ],
  ];
  it.each(cases)("decodes the %s custom error", (name, args, expected) => {
    expect(registrationErrorMessage(revertError(name, args))).toBe(expected);
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
