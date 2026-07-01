import { Card, CardContent } from "@/components/ui/card";
import { IncrementCounterForm } from "@/features/counter/components/IncrementCounterForm";
import { getCount } from "@/features/counter/server/getCount";
import { CreateSampleForm } from "@/features/samples/components/CreateSampleForm";
import { listSamples } from "@/features/samples/server/samples";
import { WalletConnect } from "@/shared/web3/components/WalletConnect";

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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-12">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Counter contract</h2>
          <WalletConnect />
        </div>
        {countError ? (
          <p className="text-sm text-destructive">{countError}</p>
        ) : (
          <p className="text-sm">
            Current value:{" "}
            <span className="font-mono">{count?.toString()}</span>
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
