import { ImageIcon } from "@phosphor-icons/react/dist/ssr";
import {
  ethLabel,
  formatLabel,
  shortAddress,
} from "../../lib/formatTournament";
import type { TournamentStatus } from "../../lib/tournamentStatus";
import type { TournamentListItem } from "../../server/reconcileMetadata";
import { TournamentStatusBadge } from "./TournamentStatusBadge";

/**
 * Details-page header: cover, status, name (or shortened address fallback), the
 * headline on-chain facts, and the emphasized prize. The Join + Edit islands
 * live on the tab strip row (see {TournamentDetails}).
 */
export function TournamentHeader({
  item,
  status,
}: {
  item: TournamentListItem;
  status: TournamentStatus;
}) {
  const { tournament, metadata } = item;
  const title = metadata?.name ?? shortAddress(tournament.address);

  return (
    <header className="flex flex-col gap-6">
      <Cover url={metadata?.imageUrl} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <TournamentStatusBadge status={status} />
            <span className="font-mono text-xs text-muted-foreground">
              {shortAddress(tournament.address)}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>{formatLabel(tournament.format)}</span>
            <span aria-hidden>{"\u00B7"}</span>
            <span>{tournament.maxPlayers} players</span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Prize
          </span>
          <span className="font-mono text-3xl font-bold tracking-tight text-primary">
            {ethLabel(tournament.prize)}
          </span>
        </div>
      </div>
    </header>
  );
}

function Cover({ url }: { url?: string }) {
  if (!url) {
    return (
      <div className="grid h-48 w-full place-items-center rounded-xl bg-muted text-muted-foreground">
        <ImageIcon className="size-10" />
      </div>
    );
  }
  return (
    // Off-chain cover served from our own /api/images route; a plain <img> keeps
    // the route self-contained (no next/image loader config needed).
    // biome-ignore lint/performance/noImgElement: served by our /api/images route
    <img
      src={url}
      alt=""
      className="h-48 w-full rounded-xl object-cover sm:h-64"
    />
  );
}
