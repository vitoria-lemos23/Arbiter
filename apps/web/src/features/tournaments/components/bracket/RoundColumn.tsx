import type { Match, ProfileDoc } from "@arbiter/db";
import { MatchCard } from "./MatchCard";

export function RoundColumn({
  label,
  matches,
  profiles = new Map(),
}: {
  label: string;
  matches: Match[];
  profiles?: Map<string, ProfileDoc>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="flex flex-1 flex-col justify-around gap-6">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} profiles={profiles} />
        ))}
      </div>
    </div>
  );
}
