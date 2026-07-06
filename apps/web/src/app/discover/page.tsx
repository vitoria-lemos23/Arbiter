import { TournamentList } from "@/features/tournaments/components/TournamentList";
import {
  countTournaments,
  listTournamentsWithMetadata,
} from "@/features/tournaments/server/listTournaments";

// Reads indexed data per request — not prerendered at build.
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 12;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 48;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Parse a numeric search param, falling back when absent/NaN. */
function toInt(raw: string | string[] | undefined, fallback: number): number {
  const value = Number.parseInt(
    Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? ""),
    10,
  );
  return Number.isNaN(value) ? fallback : value;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const pageSize = clamp(
    toInt(sp.pageSize, DEFAULT_PAGE_SIZE),
    MIN_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );

  const total = await countTournaments();
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = clamp(toInt(sp.page, 1), 1, lastPage);

  const items = await listTournamentsWithMetadata({ page, pageSize });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Discover tournaments
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse tournaments deployed on-chain.
        </p>
      </div>
      <TournamentList
        items={items}
        page={page}
        lastPage={lastPage}
        pageSize={pageSize}
      />
    </main>
  );
}
