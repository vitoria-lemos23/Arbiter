import type { Match } from "@arbiter/db";
import { shortAddress } from "../../lib/formatTournament";

export function MatchCard({ match }: { match: Match }) {
  return (
    <div className="flex w-64 flex-col overflow-hidden rounded-xl border border-input bg-card shadow-sm">
      <PlayerSlot player={match.playerA} seed={match.seedA} />
      <div className="h-px w-full bg-border" />
      <PlayerSlot player={match.playerB} seed={match.seedB} />
    </div>
  );
}

function PlayerSlot({
  player,
  seed,
}: {
  player: string | null;
  seed: number | null;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 bg-muted/30 px-4 py-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-input bg-muted/50" />
        <span className="text-sm font-medium text-muted-foreground">TBD</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <AddressAvatar address={player} />
      <span className="font-mono text-sm">{shortAddress(player)}</span>
      {seed && (
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          #{seed}
        </span>
      )}
    </div>
  );
}

function AddressAvatar({ address }: { address: string }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs uppercase text-muted-foreground"
    >
      {address.slice(2, 4)}
    </span>
  );
}
