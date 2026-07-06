import { ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { formatEther } from "viem";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TOURNAMENT_FORMATS } from "../schema/createTournament";
import type { TournamentListItem } from "../server/listTournaments";

function formatLabel(format: number): string {
  return TOURNAMENT_FORMATS.find((f) => f.value === format)?.label ?? "Unknown";
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function ethLabel(wei: string): string {
  try {
    return `Ξ${formatEther(BigInt(wei))}`;
  } catch {
    return "Ξ0";
  }
}

/**
 * One tournament in the discover grid. The on-chain row always renders; the
 * off-chain metadata (cover, name, description, tags) enriches it when present
 * and reconciled — otherwise the card falls back to on-chain-only facts.
 */
export function TournamentCard({ item }: { item: TournamentListItem }) {
  const { tournament, metadata } = item;
  const title = metadata?.name ?? shortAddress(tournament.address);

  return (
    <Card className="gap-0">
      <Cover url={metadata?.imageUrl} />
      <CardHeader className="pt-4">
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
          <Fact label="Entry fee" value={ethLabel(tournament.entryFee)} mono />
          <Fact
            label="Starts"
            value={tournament.startDate.toLocaleDateString()}
          />
          <Fact label="Ends" value={tournament.endDate.toLocaleDateString()} />
        </dl>
      </CardContent>
    </Card>
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
