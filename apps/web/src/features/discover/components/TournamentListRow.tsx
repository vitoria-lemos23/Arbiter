import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/features/tournaments/components/details/TournamentStatusBadge";
import {
  ethLabel,
  formatLabel,
  shortAddress,
} from "@/features/tournaments/lib/formatTournament";
import { deriveTournamentStatus } from "@/features/tournaments/lib/tournamentStatus";
import type { TournamentListItem } from "@/features/tournaments/server/reconcileMetadata";

/**
 * Wide list row for matches beyond the first three cards (spec 010). Server
 * component; shows the status badge and prize with a "Register" action while
 * registration is open, otherwise a "Details" link.
 */
export function TournamentListRow({ item }: { item: TournamentListItem }) {
  const { tournament, metadata } = item;
  const status = deriveTournamentStatus(
    tournament.startDate,
    tournament.endDate,
    new Date(),
  );
  const title = metadata?.name ?? shortAddress(tournament.address);
  const meta = [
    `${tournament.maxPlayers} players`,
    formatLabel(tournament.format),
    `by ${shortAddress(tournament.organizer)}`,
  ].join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/tournaments/${tournament.address}`}
            className="truncate font-medium hover:underline"
          >
            {title}
          </Link>
          <TournamentStatusBadge status={status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">{meta}</p>
      </div>
      <p className="font-mono text-sm font-semibold">
        {ethLabel(tournament.prize)}
      </p>
      {status === "soon" ? (
        <Button asChild size="sm">
          <Link href={`/tournaments/${tournament.address}/register`}>
            Register
          </Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link href={`/tournaments/${tournament.address}`}>Details</Link>
        </Button>
      )}
    </div>
  );
}
