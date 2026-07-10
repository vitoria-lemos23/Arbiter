import type { Address } from "viem";
import { shortAddress } from "../../lib/formatTournament";
import { majorityThreshold } from "../../lib/voteProgress";

/**
 * Public, real-time breakdown of how each judge voted on a match (design screen
 * 6 sidebar). One row per judge: their address and the player they picked, or
 * "pending" until they vote. Presentational — the caller supplies the panel and
 * the live vote map (see `useMatchVotes`).
 */
export function JudgeVoteList({
  judges,
  votesByJudge,
  labelFor,
}: {
  judges: readonly Address[];
  votesByJudge: Map<string, Address>;
  /** Renders a player address as a display label (name or shortened address). */
  labelFor: (player: Address) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">
        Judge votes, majority of {majorityThreshold(judges.length)}
      </h3>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-input">
        {judges.map((judge) => {
          const votedFor = votesByJudge.get(judge.toLowerCase());
          return (
            <li
              key={judge}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {shortAddress(judge)}
              </span>
              {votedFor ? (
                <span className="text-sm font-medium">
                  {labelFor(votedFor)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">pending</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
