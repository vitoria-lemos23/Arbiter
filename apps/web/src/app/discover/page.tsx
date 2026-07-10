import { DiscoverFilters } from "@/features/discover/components/DiscoverFilters";
import { DiscoverResults } from "@/features/discover/components/DiscoverResults";
import { DiscoverSearchBar } from "@/features/discover/components/DiscoverSearchBar";
import { FeaturedTournamentBanner } from "@/features/discover/components/FeaturedTournamentBanner";
import { loadMoreHref } from "@/features/discover/lib/discoverHref";
import {
  hasActiveFilters,
  LIST_STEP,
  MAX_SHOW,
  parseDiscoverQuery,
} from "@/features/discover/schema/discoverQuery";
import { getDiscoverFacets } from "@/features/discover/server/getDiscoverFacets";
import { getFeaturedTournament } from "@/features/discover/server/getFeaturedTournament";
import { queryDiscoverTournaments } from "@/features/discover/server/queryDiscoverTournaments";

// Reads indexed data per request — not prerendered at build.
export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const query = parseDiscoverQuery(sp);
  const featured = await getFeaturedTournament();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 lg:p-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Discover tournaments
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse tournaments deployed on-chain.
        </p>
      </div>

      {featured ? (
        <FeaturedTournamentBanner item={featured} />
      ) : (
        <div className="grid place-items-center rounded-xl border border-dashed py-20 text-center">
          <p className="text-sm text-muted-foreground">No tournaments yet.</p>
        </div>
      )}

      {featured ? (
        <DiscoverBrowse query={query} rawParams={sp} featured={featured} />
      ) : null}
    </main>
  );
}

/**
 * The filter/search/results section, rendered only when at least one tournament
 * exists (the hero occupies the empty-DB case). Split out so the route entry
 * stays a thin composition (AGENTS.md).
 */
async function DiscoverBrowse({
  query,
  rawParams,
  featured,
}: {
  query: ReturnType<typeof parseDiscoverQuery>;
  rawParams: RawSearchParams;
  featured: NonNullable<Awaited<ReturnType<typeof getFeaturedTournament>>>;
}) {
  const [facets, results] = await Promise.all([
    getDiscoverFacets(),
    queryDiscoverTournaments(query, {
      featuredAddress: featured.tournament.address,
    }),
  ]);

  const nextShow = Math.min(query.show + LIST_STEP, MAX_SHOW);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <DiscoverFilters facets={facets} />
      <div className="flex flex-col gap-6">
        <DiscoverSearchBar />
        <DiscoverResults
          items={results.items}
          hasMore={results.hasMore}
          hasActiveFilters={hasActiveFilters(query)}
          loadMoreHref={loadMoreHref(rawParams, nextShow)}
        />
      </div>
    </div>
  );
}
