import { BaseError, ContractFunctionRevertedError } from "viem";

/**
 * Human-readable message for a failed `register()` write. Decodes the
 * contract's custom errors (races: the tournament filled or closed between the
 * UI read and mining — spec 005 edge cases) and falls back to viem's
 * `shortMessage` for everything else (user rejection, insufficient funds).
 *
 * @example
 * registrationErrorMessage(error); // → "This tournament is full."
 */
const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  RegistrationClosed: "Registration closed before your transaction was mined.",
  AlreadyRegistered: "This wallet is already registered.",
  TournamentFull: "This tournament is full.",
  IncorrectEntryFee:
    "The transaction did not include the exact entry fee. Please try again.",
};

export function registrationErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (!(error instanceof BaseError)) {
    return error instanceof Error ? error.message : String(error);
  }
  const revert = error.walk(
    (cause) => cause instanceof ContractFunctionRevertedError,
  );
  if (revert instanceof ContractFunctionRevertedError) {
    const name = revert.data?.errorName ?? revert.signature;
    if (name && CUSTOM_ERROR_MESSAGES[name]) return CUSTOM_ERROR_MESSAGES[name];
  }
  return error.shortMessage;
}
