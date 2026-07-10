"use client";

import { PlusIcon, WalletIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletConnect } from "@/shared/web3/components/WalletConnect";
import { useWalletConnect } from "@/shared/web3/hooks/useWalletConnect";
import {
  listMyTournaments,
  type MyTournament,
} from "../actions/listMyTournaments";
import { MyTournamentsList } from "./MyTournamentsList";

/**
 * The `/` dashboard (#008). Client component because the wallet address lives
 * only in the browser (wagmi); it reads the connected address and calls the
 * `listMyTournaments` server action. Renders a connect prompt when no wallet is
 * connected, a skeleton while loading, then the role-tabbed list.
 */
export function MyTournamentsPage() {
  const { address, isConnected } = useWalletConnect();
  const [items, setItems] = useState<MyTournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setItems(null);
      return;
    }
    // `active` guards against a resolved fetch for a wallet the user already
    // switched away from (React strict-mode double-run / fast reconnects).
    let active = true;
    setItems(null);
    setError(null);
    listMyTournaments(address)
      .then((rows) => active && setItems(rows))
      .catch(
        (err) =>
          active &&
          setError(
            err instanceof Error ? err.message : "Failed to load tournaments",
          ),
      );
    return () => {
      active = false;
    };
  }, [address]);

  if (!isConnected || !address) return <ConnectWalletPrompt />;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Tournaments</h1>
        <Button asChild>
          <Link href="/tournaments/new">
            <PlusIcon />
            New tournament
          </Link>
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : items === null ? (
        <LoadingGrid />
      ) : (
        <MyTournamentsList items={items} />
      )}
    </main>
  );
}

function ConnectWalletPrompt() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-12 text-center">
      <WalletIcon className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold tracking-tight">Connect your wallet</h1>
      <p className="text-sm text-muted-foreground">
        {"Connect your wallet to see the tournaments you're participating in."}
      </p>
      <WalletConnect />
    </main>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  );
}
