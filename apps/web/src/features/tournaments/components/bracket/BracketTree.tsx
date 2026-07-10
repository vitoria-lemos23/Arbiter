import type { Match } from "@arbiter/db";
import { getRoundLabel, getRounds } from "../../lib/bracketRounds";
import { ChampionDisplay } from "./ChampionDisplay";
import { RoundColumn } from "./RoundColumn";

export function BracketTree({
  matches,
  maxPlayers,
  champion,
  prizeWei,
}: {
  matches: Match[];
  maxPlayers: number;
  champion: string | null;
  prizeWei: string;
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
            <ChampionDisplay champion={champion} prizeWei={prizeWei} />
          </div>
        </div>
      </div>
    </div>
  );
}
