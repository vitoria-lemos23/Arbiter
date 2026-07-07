import { Skeleton } from "@/components/ui/skeleton";

/** Matches the details layout: cover, header facts, tab strip, panel body. */
export default function TournamentDetailsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 sm:p-12">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 w-full rounded-xl sm:h-64" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-9 w-80 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static skeleton
            key={i}
            className="h-12 w-full"
          />
        ))}
      </div>
    </main>
  );
}
