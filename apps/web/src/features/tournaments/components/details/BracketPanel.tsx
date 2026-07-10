import { listMatches } from "../../server/getBracket";
import { BracketTree } from "../bracket/BracketTree";

export async function BracketPanel({
  tournamentAddress,
  maxPlayers,
  registeredCount,
  prizeWei,
  champion,
}: {
  tournamentAddress: string;
  maxPlayers: number;
  registeredCount: number;
  prizeWei: string;
  champion: string | null;
}) {
  const matches = await listMatches(tournamentAddress);

  if (matches.length === 0) {
    return (
      <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-input px-6 py-16 text-center">
        <p className="text-base font-medium">Bracket not generated</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          The bracket locks automatically when the tournament fills (
          {registeredCount} / {maxPlayers} registered).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-input bg-card p-6 shadow-sm">
      <BracketTree
        matches={matches}
        maxPlayers={maxPlayers}
        champion={champion}
        prizeWei={prizeWei}
      />
    </div>
  );
}
