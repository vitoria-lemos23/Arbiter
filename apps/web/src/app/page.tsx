import { listSamples } from "@/server/samples";
import { getCount } from "@/server/counter";
import { CreateSampleForm } from "./create-sample-form";
import { IncrementCounterForm } from "./increment-counter-form";

// Reads live data per request — not prerendered at build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const samples = await listSamples();

  // The contract may not be deployed/reachable yet; surface that instead of
  // crashing the page.
  let count: bigint | null = null;
  let countError: string | null = null;
  try {
    count = await getCount();
  } catch (err) {
    countError = err instanceof Error ? err.message : "Failed to read contract";
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Arbiter</h1>
        <p className="text-sm text-gray-500">
          Decentralized tournament platform — tRPC wiring test
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Counter contract</h2>
        {countError ? (
          <p className="text-sm text-red-600">{countError}</p>
        ) : (
          <p className="text-sm">
            Current value: <span className="font-mono">{count?.toString()}</span>
          </p>
        )}
        <IncrementCounterForm />
      </section>

      <CreateSampleForm />

      <ul className="flex flex-col gap-1">
        {samples.length === 0 ? (
          <li className="text-sm text-gray-500">No samples yet.</li>
        ) : (
          samples.map((s) => (
            <li key={s.id} className="rounded border px-3 py-2 text-sm">
              {s.name}
              <span className="ml-2 text-gray-400">
                {s.createdAt.toISOString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}