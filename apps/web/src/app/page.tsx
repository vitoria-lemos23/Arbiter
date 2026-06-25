import { listSamples } from "@/features/samples/samples";
import { getCount } from "@/features/counter/counter";
import { CreateSampleForm } from "@/features/samples/create-sample-form";
import { IncrementCounterForm } from "@/features/counter/increment-counter-form";
import { WalletConnect } from "@/shared/web3/wallet-connect";
import { Card, CardContent } from "@/components/ui/card";

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
        <p className="text-sm text-muted-foreground">
          Decentralized tournament platform — tRPC wiring test
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Counter contract</h2>
          <WalletConnect />
        </div>
        {countError ? (
          <p className="text-sm text-destructive">{countError}</p>
        ) : (
          <p className="text-sm">
            Current value: <span className="font-mono">{count?.toString()}</span>
          </p>
        )}
        <IncrementCounterForm />
      </section>

      <CreateSampleForm />

      {samples.length === 0 ? (
        <p className="text-sm text-muted-foreground">No samples yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {samples.map((s) => (
            <Card key={s.id} size="sm">
              <CardContent className="flex items-center justify-between gap-2">
                <span>{s.name}</span>
                <span className="text-muted-foreground">
                  {s.createdAt.toISOString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}