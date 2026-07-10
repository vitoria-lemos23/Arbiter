import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/features/tournaments/components/TournamentCard";
import type { TournamentListItem } from "@/features/tournaments/server/reconcileMetadata";
import { CARDS_COUNT } from "../schema/discoverQuery";
import { TournamentListRow } from "./TournamentListRow";

/**
 * Two-tier result area (spec 010): the first {CARDS_COUNT} matches render as
 * cards, the remainder as wide list rows, with a "Load more" link that grows
 * `?show`. Server component; shows a filter-aware empty state when nothing
 * matches.
 */
export function DiscoverResults({
  items,
  hasMore,
  hasActiveFilters,
  loadMoreHref,
}: {
  items: TournamentListItem[];
  hasMore: boolean;
  hasActiveFilters: boolean;
  loadMoreHref: string;
}) {
  if (items.length === 0) {
    return <EmptyState hasActiveFilters={hasActiveFilters} />;
  }

  const cards = items.slice(0, CARDS_COUNT);
  const rows = items.slice(CARDS_COUNT);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <TournamentCard key={item.tournament.address} item={item} />
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            More tournaments
          </h2>
          <div className="flex flex-col gap-2">
            {rows.map((item) => (
              <TournamentListRow key={item.tournament.address} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={loadMoreHref}>Load more</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed py-20 text-center">
      <p className="text-sm text-muted-foreground">
        {hasActiveFilters
          ? "No tournaments match your filters."
          : "No more tournaments to browse."}
      </p>
      {hasActiveFilters ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/discover">Clear all filters</Link>
        </Button>
      ) : null}
    </div>
  );
}
