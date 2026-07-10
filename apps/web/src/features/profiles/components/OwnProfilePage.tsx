"use client";

import { WalletIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletConnect } from "@/shared/web3/components/WalletConnect";
import { useWalletConnect } from "@/shared/web3/hooks/useWalletConnect";
import { loadProfile, type ProfileView } from "../actions/loadProfile";
import { PlayedTournamentsList } from "./PlayedTournamentsList";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfileHeader } from "./ProfileHeader";

/**
 * The `/profile` own-profile page (spec 009). Client component because the
 * wallet address lives only in the browser (wagmi): it reads the connected
 * address, loads the profile via the `loadProfile` server action, and toggles
 * between an inline view and edit mode. Shows a connect-wallet gate when no
 * wallet is connected. Mirrors `MyTournamentsPage`.
 */

/** Fetch result tagged with the wallet it belongs to, so a stale result from a
 *  previous wallet is never shown against the current one. */
type LoadState =
  | { address: string; view: ProfileView }
  | { address: string; error: string };

export function OwnProfilePage() {
  const { address, isConnected } = useWalletConnect();
  const [state, setState] = useState<LoadState | null>(null);
  const [editing, setEditing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is an intentional trigger to refetch after a successful save
  useEffect(() => {
    if (!address) return;
    let active = true;
    loadProfile(address)
      .then((view) => active && setState({ address, view }))
      .catch(
        (err) =>
          active &&
          setState({
            address,
            error:
              err instanceof Error ? err.message : "Failed to load profile",
          }),
      );
    return () => {
      active = false;
    };
  }, [address, reloadKey]);

  if (!isConnected || !address) return <ConnectWalletGate />;

  const current = state?.address === address ? state : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 sm:p-12">
      {current === null ? (
        <ProfileSkeleton />
      ) : "error" in current ? (
        <p className="text-sm text-destructive">{current.error}</p>
      ) : editing ? (
        <ProfileEditForm
          userAddress={address}
          profile={current.view.profile}
          onDone={() => {
            setEditing(false);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : (
        <>
          <ProfileHeader
            address={address}
            profile={current.view.profile}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                Edit profile
              </Button>
            }
          />
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Played tournaments</h2>
            <PlayedTournamentsList played={current.view.played} />
          </section>
        </>
      )}
    </main>
  );
}

function ConnectWalletGate() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-12 text-center">
      <WalletIcon className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold tracking-tight">Connect your wallet</h1>
      <p className="text-sm text-muted-foreground">
        Connect your wallet to view and edit your profile.
      </p>
      <WalletConnect />
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
