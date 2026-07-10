import type { Address } from "viem";
import { zeroAddress } from "viem";
import { Badge } from "@/components/ui/badge";
import type { MatchState } from "../../hooks/useMatchVotes";
import { shortAddress } from "../../lib/formatTournament";
import { JudgeVoteList } from "./JudgeVoteList";

/**
 * Match detail sidebar (design screen 6): status badge, the two players, and
 * the public judge-vote breakdown. Presentational — the caller supplies the
 * live match/judge/vote data (from `useMatchVotes`).
 */
export function MatchPanel({
  match,
  roundLabel,
  judges,
  votesByJudge,
  seedByAddress,
}: {
  match: MatchState;
  roundLabel: string;
  judges: readonly Address[];
  votesByJudge: Map<string, Address>;
  seedByAddress: Record<string, number>;
}) {
  const labelFor = (player: Address) => {
    const seed = seedByAddress[player.toLowerCase()];
    return seed ? `${shortAddress(player)} #${seed}` : shortAddress(player);
  };

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-input bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{roundLabel}</span>
        <MatchStatusBadge status={match.status} />
      </div>

      {match.status === 1 ? (
        <p className="text-xs text-muted-foreground">awaiting judges</p>
      ) : null}

      <div className="flex flex-col gap-2">
        <PlayerRow
          player={match.playerA}
          seed={seedByAddress[match.playerA.toLowerCase()]}
          isWinner={match.winner.toLowerCase() === match.playerA.toLowerCase()}
        />
        <PlayerRow
          player={match.playerB}
          seed={seedByAddress[match.playerB.toLowerCase()]}
          isWinner={match.winner.toLowerCase() === match.playerB.toLowerCase()}
        />
      </div>

      <JudgeVoteList
        judges={judges}
        votesByJudge={votesByJudge}
        labelFor={labelFor}
      />
    </aside>
  );
}

function MatchStatusBadge({ status }: { status: number }) {
  if (status === 2) return <Badge variant="secondary">Completed</Badge>;
  if (status === 1) return <Badge>Live</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

function PlayerRow({
  player,
  seed,
  isWinner,
}: {
  player: Address;
  seed?: number;
  isWinner: boolean;
}) {
  if (player === zeroAddress) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        TBD
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        isWinner ? "border-l-4 border-l-primary bg-primary/5" : "bg-muted/30"
      }`}
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs uppercase text-muted-foreground"
      >
        {player.slice(2, 4)}
      </span>
      <span className="font-mono text-sm">{shortAddress(player)}</span>
      {seed ? (
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          #{seed}
        </span>
      ) : null}
    </div>
  );
}
