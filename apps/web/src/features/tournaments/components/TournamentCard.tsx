import { ImageIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MyTournamentRole } from "../actions/listMyTournaments";
import { ethLabel, formatLabel, shortAddress } from "../lib/formatTournament";
import type { TournamentListItem } from "../server/listTournaments";
import { TournamentRoleBadge } from "./TournamentRoleBadge";

/**
 * One tournament in the discover grid. The on-chain row always renders; the
 * off-chain metadata (cover, name, description, tags) enriches it when present
 * and reconciled — otherwise the card falls back to on-chain-only facts.
 *
 * On the "My Tournaments" dashboard (#008) the optional `roles` render as
 * badges so the user sees their relationship to each event at a glance; on the
 * discover grid `roles` is omitted and the badge row is absent.
 */
export function TournamentCard({
  item,
}: {
  item: TournamentListItem & { roles?: MyTournamentRole[] };
}) {
  const { tournament, metadata, roles } = item;
  const title = metadata?.name ?? shortAddress(tournament.address);

  return (
    <Link
      href={`/tournaments/${tournament.address}`}
      className="block transition-transform hover:-translate-y-0.5"
    >
      <Card className="gap-0 hover:ring-primary/40">
        <Cover url={metadata?.imageUrl} />
        <CardHeader className="pt-4">
          {roles && roles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {roles.map((role) => (
                <TournamentRoleBadge key={role} role={role} />
              ))}
            </div>
          ) : null}
          <CardTitle className="truncate">{title}</CardTitle>
          {metadata?.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {metadata.description}
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              {shortAddress(tournament.address)}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-3">
          <Tags metadata={metadata} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <Fact label="Format" value={formatLabel(tournament.format)} />
            <Fact label="Capacity" value={`${tournament.maxPlayers} players`} />
            <Fact label="Prize" value={ethLabel(tournament.prize)} mono />
            <Fact
              label="Entry fee"
              value={ethLabel(tournament.entryFee)}
              mono
            />
            <Fact
              label="Starts"
              value={tournament.startDate.toLocaleDateString()}
            />
            <Fact
              label="Ends"
              value={tournament.endDate.toLocaleDateString()}
            />
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}

function Cover({ url }: { url?: string }) {
  if (!url) {
    return (
      <div className="grid h-40 w-full place-items-center rounded-t-xl bg-muted text-muted-foreground">
        <ImageIcon className="size-8" />
      </div>
    );
  }
  // Off-chain cover served from our own /api/images route; a plain <img> keeps
  // the route self-contained (no next/image loader config needed).
  return (
    // biome-ignore lint/performance/noImgElement: served by our /api/images route
    <img src={url} alt="" className="h-40 w-full rounded-t-xl object-cover" />
  );
}

function Tags({ metadata }: { metadata: TournamentListItem["metadata"] }) {
  const chips = [metadata?.game, metadata?.category].filter((v): v is string =>
    Boolean(v),
  );
  const tags = metadata?.tags ?? [];
  if (chips.length === 0 && tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Badge key={chip} variant="secondary">
          {chip}
        </Badge>
      ))}
      {tags.map((tag) => (
        <Badge key={tag} variant="outline">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : undefined}>{value}</dd>
    </div>
  );
}
