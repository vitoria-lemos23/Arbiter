import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-12">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-10 rounded-lg" />
    </main>
  );
}
