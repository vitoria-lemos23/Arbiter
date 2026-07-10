import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TournamentStatusBadge } from "@/features/tournaments/components/details/TournamentStatusBadge";
import {
  ethLabel,
  formatLabel,
  shortAddress,
} from "@/features/tournaments/lib/formatTournament";
import { deriveTournamentStatus } from "@/features/tournaments/lib/tournamentStatus";
import type { TournamentListItem } from "@/features/tournaments/server/reconcileMetadata";
import { relativeDate } from "../lib/relativeDate";

/**
 * Promotional hero for the newest tournament (spec 010). Server component:
 * derives the live status from the request-time clock and renders on-chain
 * facts enriched by trusted metadata, with a "Join" action only while
 * registration is open ("soon").
 */
export function FeaturedTournamentBanner({
  item,
}: {
  item: TournamentListItem;
}) {
  const { tournament, metadata } = item;
  const now = new Date();
  const status = deriveTournamentStatus(
    tournament.startDate,
    tournament.endDate,
    now,
  );
  const title = metadata?.name ?? shortAddress(tournament.address);
  const summary = [
    `${tournament.maxPlayers} players`,
    formatLabel(tournament.format),
    relativeDate(tournament.startDate, now),
    `by ${shortAddress(tournament.organizer)}`,
  ].join(" · ");

  return (
    <Card className="gap-4 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="tracking-wide">FEATURED</Badge>
        <TournamentStatusBadge status={status} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{summary}</p>
        {metadata?.description ? (
          <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
            {metadata.description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-lg font-semibold">
          Prize {ethLabel(tournament.prize)}
        </p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/tournaments/${tournament.address}`}>Details</Link>
          </Button>
          {status === "soon" ? (
            <Button asChild>
              <Link href={`/tournaments/${tournament.address}/register`}>
                Join
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
