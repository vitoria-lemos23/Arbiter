import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { shortAddress } from "@/features/tournaments/lib/formatTournament";
import { deriveTournamentStatus } from "@/features/tournaments/lib/tournamentStatus";
import type { PlayedTournament } from "../server/getPlayedTournaments";

/**
 * The played-tournaments history for a profile (spec 009): tournaments the
 * address is registered in, newest-first, each linking to the tournament
 * detail page. Read-only and used by both the own and public profile views.
 */
export function PlayedTournamentsList({
  played,
}: {
  played: PlayedTournament[];
}) {
  if (played.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-input px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No tournaments played yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-input">
      {played.map((item) => (
        <PlayedRow key={item.tournament.address} item={item} />
      ))}
    </ul>
  );
}

function PlayedRow({ item }: { item: PlayedTournament }) {
  const { tournament, metadata } = item;
  const status = deriveTournamentStatus(
    tournament.startDate,
    tournament.endDate,
    new Date(),
  );
  const name = metadata?.name ?? shortAddress(tournament.address);

  return (
    <li>
      <Link
        href={`/tournaments/${tournament.address}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
      >
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      </Link>
    </li>
  );
}
