import type { Match, ProfileDoc } from "@arbiter/db";
import { getRoundLabel, getRounds } from "../../lib/bracketRounds";
import { ChampionDisplay } from "./ChampionDisplay";
import { RoundColumn } from "./RoundColumn";

export function BracketTree({
  matches,
  maxPlayers,
  champion,
  prizeWei,
  profiles = new Map(),
}: {
  matches: Match[];
  maxPlayers: number;
  champion: string | null;
  prizeWei: string;
  profiles?: Map<string, ProfileDoc>;
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
              profiles={profiles}
            />
          );
        })}

        {/* Champion Column */}
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Champion
          </h3>
          <div className="flex flex-1 flex-col justify-around">
            <ChampionDisplay
              champion={champion}
              prizeWei={prizeWei}
              profile={
                champion ? profiles.get(champion.toLowerCase()) : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
