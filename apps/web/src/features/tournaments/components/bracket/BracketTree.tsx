import type { Match } from "@arbiter/db";
import { getRoundLabel, getRounds } from "../../lib/bracketRounds";
import { RoundColumn } from "./RoundColumn";

export function BracketTree({
  matches,
  maxPlayers,
}: {
  matches: Match[];
  maxPlayers: number;
}) {
  const rounds = getRounds(maxPlayers);

  // Group matches by round
  const matchesByRound = new Map<number, Match[]>();
  for (const m of matches) {
    const list = matchesByRound.get(m.round) || [];
    list.push(m);
    matchesByRound.set(m.round, list);
  }

  return (
    <div className="flex w-full overflow-x-auto pb-8">
      <div className="flex gap-12">
        {rounds.map((r) => {
          const roundMatches = matchesByRound.get(r) || [];
          return (
            <RoundColumn
              key={r}
              label={getRoundLabel(maxPlayers, r)}
              matches={roundMatches}
            />
          );
        })}

        {/* Champion Column */}
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Champion
          </h3>
          <div className="flex flex-1 flex-col justify-around">
            <div className="flex w-64 items-center gap-3 rounded-xl border border-dashed border-input bg-muted/30 px-4 py-6">
              <div className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-input bg-muted/50 font-mono text-xs text-muted-foreground">
                ?
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                TBD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
