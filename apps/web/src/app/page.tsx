import { listSamples } from "@/server/samples";
import { CreateSampleForm } from "./create-sample-form";

// Reads live data per request — not prerendered at build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const samples = await listSamples();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Arbiter</h1>
        <p className="text-sm text-gray-500">
          Decentralized tournament platform — tRPC wiring test
        </p>
      </header>

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