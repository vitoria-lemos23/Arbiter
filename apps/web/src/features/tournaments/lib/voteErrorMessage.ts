import { BaseError, ContractFunctionRevertedError } from "viem";

/**
 * Human-readable message for a failed `castVote` / `withdrawFees` write.
 * Decodes the tournament's custom errors (spec 007) — most surface as races
 * (the match resolved, or another judge voted, between the UI read and mining)
 * — and falls back to viem's `shortMessage` (user rejection, insufficient gas).
 *
 * @example
 * voteErrorMessage(error); // → "This match already resolved."
 */
const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  NotJudge: "Only an assigned judge can vote on this match.",
  MatchNotActive: "This match is not open for voting.",
  AlreadyVoted: "You have already voted on this match.",
  InvalidVoteTarget: "That player is not part of this match.",
  InvalidMatchIndex: "This match does not exist.",
  NotOrganizer: "Only the organizer can withdraw fees.",
  TournamentNotCompleted:
    "Fees can only be withdrawn after the tournament completes.",
  NoFeesToWithdraw: "There are no fees left to withdraw.",
  PrizeTransferFailed: "The prize transfer to the champion failed.",
  FeeTransferFailed: "The fee transfer to the organizer failed.",
};

export function voteErrorMessage(error: unknown): string | null {
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
