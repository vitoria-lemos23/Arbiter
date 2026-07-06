import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { TournamentListItem } from "../server/listTournaments";
import { TournamentCard } from "./TournamentCard";

type PageRef = number | "ellipsis";

/** Compact page window: first, last, and a ±1 band around the current page. */
function pageWindow(current: number, last: number): PageRef[] {
  const pages = new Set<number>([1, last, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);
  const out: PageRef[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Preserve a non-default pageSize across page links. */
function hrefFor(page: number, pageSize: number): string {
  const params = new URLSearchParams({ page: String(page) });
  if (pageSize !== 12) params.set("pageSize", String(pageSize));
  return `/discover?${params.toString()}`;
}

/**
 * Paginated grid of tournament cards (Server Component). Pagination is
 * link-driven (`?page=N`) so it works without client JS; the empty state shows
 * when no tournaments have been indexed yet.
 */
export function TournamentList({
  items,
  page,
  lastPage,
  pageSize,
}: {
  items: TournamentListItem[];
  page: number;
  lastPage: number;
  pageSize: number;
}) {
  if (items.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed py-20 text-center">
        <p className="text-sm text-muted-foreground">No tournaments yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <TournamentCard key={item.tournament.address} item={item} />
        ))}
      </div>

      {lastPage > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={hrefFor(Math.max(1, page - 1), pageSize)}
                aria-disabled={page === 1}
                className={
                  page === 1 ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>
            {pageWindow(page, lastPage).map((ref, i) =>
              ref === "ellipsis" ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis has no stable id
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={ref}>
                  <PaginationLink
                    href={hrefFor(ref, pageSize)}
                    isActive={ref === page}
                  >
                    {ref}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href={hrefFor(Math.min(lastPage, page + 1), pageSize)}
                aria-disabled={page === lastPage}
                className={
                  page === lastPage
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
