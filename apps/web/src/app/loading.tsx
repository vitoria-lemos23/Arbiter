export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-12">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-10 animate-pulse rounded-lg bg-muted" />
    </main>
  );
}
