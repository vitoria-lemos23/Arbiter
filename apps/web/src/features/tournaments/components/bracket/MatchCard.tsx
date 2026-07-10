import type { Match, ProfileDoc } from "@arbiter/db";
import Link from "next/link";
import { UserAvatar } from "@/features/profiles/components/UserAvatar";
import { shortAddress } from "../../lib/formatTournament";

/**
 * One bracket match. Active matches (both players known, awaiting votes) glow
 * with a lime ring and link to the judge/detail screen; completed matches
 * accent the winner's slot (spec 007). TBD internal nodes render inert.
 * Player slots resolve a display name + avatar via the injected `profiles` map
 * (batch-fetched by the parent server component to avoid N+1, spec 009).
 */
export function MatchCard({
  match,
  profiles = new Map(),
}: {
  match: Match;
  profiles?: Map<string, ProfileDoc>;
}) {
  const isActive = match.status === 1;
  const winner = match.winner?.toLowerCase() ?? null;
  const playable = Boolean(match.playerA && match.playerB);

  const card = (
    <div
      className={`flex w-64 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors ${
        isActive ? "border-primary/60 ring-1 ring-primary/40" : "border-input"
      } ${playable ? "hover:border-primary/60" : ""}`}
    >
      <PlayerSlot
        player={match.playerA}
        seed={match.seedA}
        isWinner={winner != null && winner === match.playerA?.toLowerCase()}
        profile={
          match.playerA ? profiles.get(match.playerA.toLowerCase()) : undefined
        }
      />
      <div className="h-px w-full bg-border" />
      <PlayerSlot
        player={match.playerB}
        seed={match.seedB}
        isWinner={winner != null && winner === match.playerB?.toLowerCase()}
        profile={
          match.playerB ? profiles.get(match.playerB.toLowerCase()) : undefined
        }
      />
    </div>
  );

  if (!playable) return card;
  return (
    <Link
      href={`/tournaments/${match.tournament}/matches/${match.matchIndex}/vote`}
      className="block"
    >
      {card}
    </Link>
  );
}

function PlayerSlot({
  player,
  seed,
  isWinner,
  profile,
}: {
  player: string | null;
  seed: number | null;
  isWinner: boolean;
  profile?: ProfileDoc;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 bg-muted/30 px-4 py-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-input bg-muted/50" />
        <span className="text-sm font-medium text-muted-foreground">TBD</span>
      </div>
    );
  }

  const name = profile?.displayName;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        isWinner ? "border-l-4 border-l-primary bg-primary/5" : ""
      }`}
    >
      <UserAvatar
        address={player}
        avatarUrl={profile?.avatarUrl}
        displayName={name}
        size="sm"
      />
      <span
        className={name ? "truncate text-sm font-medium" : "font-mono text-sm"}
      >
        {name ?? shortAddress(player)}
      </span>
      {isWinner ? (
        <span className="ml-auto text-xs font-semibold uppercase text-primary">
          Won
        </span>
      ) : seed ? (
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          #{seed}
        </span>
      ) : null}
    </div>
  );
}
