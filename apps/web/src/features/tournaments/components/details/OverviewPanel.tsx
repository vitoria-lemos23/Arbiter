import { Badge } from "@/components/ui/badge";
import { ethLabel, formatLabel } from "../../lib/formatTournament";
import type { TournamentListItem } from "../../server/reconcileMetadata";

/**
 * On-chain facts plus reconciled off-chain metadata for the Overview tab. The
 * on-chain block always renders; description/game/category/tags only appear when
 * trusted metadata is present.
 */
export function OverviewPanel({ item }: { item: TournamentListItem }) {
  const { tournament, metadata } = item;
  return (
    <div className="flex flex-col gap-6">
      {metadata?.description ? (
        <p className="text-sm leading-relaxed text-foreground">
          {metadata.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No description was provided for this tournament.
        </p>
      )}

      <Chips metadata={metadata} />

      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Fact label="Format" value={formatLabel(tournament.format)} />
        <Fact label="Capacity" value={`${tournament.maxPlayers} players`} />
        <Fact label="Prize" value={ethLabel(tournament.prize)} mono />
        <EntryFeeFact wei={tournament.entryFee} />
        <Fact label="Starts" value={tournament.startDate.toLocaleString()} />
        <Fact label="Ends" value={tournament.endDate.toLocaleString()} />
        <Fact label="Organizer" value={tournament.organizer} mono wide />
        <Fact label="Contract" value={tournament.address} mono wide />
      </dl>
    </div>
  );
}

function EntryFeeFact({ wei }: { wei: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">Entry fee</dt>
      <dd className="font-mono">{ethLabel(wei)}</dd>
      <p className="text-xs text-muted-foreground">
        Paid on-chain when a player registers.
      </p>
    </div>
  );
}

function Chips({ metadata }: { metadata: TournamentListItem["metadata"] }) {
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
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide ? "flex flex-col gap-1 sm:col-span-2" : "flex flex-col gap-1"
      }
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono break-all" : undefined}>{value}</dd>
    </div>
  );
}
