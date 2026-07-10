"use client";

import type { Address } from "viem";
import { Button } from "@/components/ui/button";
import { useWithdrawFees } from "../../hooks/useWithdrawFees";

/**
 * Organizer-only CTA to withdraw the accumulated entry fees after the
 * tournament completes (spec 007). Renders nothing unless the connected wallet
 * is the organizer and the tournament has completed — so it never appears for
 * spectators or before the prize is paid.
 */
export function WithdrawFeesButton({
  tournamentAddress,
  organizer,
  isCompleted,
}: {
  tournamentAddress: Address;
  organizer: string;
  isCompleted: boolean;
}) {
  const {
    address,
    wrongChain,
    busy,
    isPending,
    isSuccess,
    errorMessage,
    withdrawFees,
    switchNetwork,
  } = useWithdrawFees({ tournamentAddress });

  const isOrganizer =
    Boolean(address) && address?.toLowerCase() === organizer.toLowerCase();
  if (!isCompleted || !isOrganizer) return null;

  if (isSuccess) {
    return <p className="text-sm font-medium text-primary">Fees withdrawn.</p>;
  }
  if (wrongChain) {
    return (
      <Button type="button" variant="outline" onClick={switchNetwork}>
        Switch network
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button type="button" disabled={busy} onClick={withdrawFees}>
        {isPending
          ? "Confirm in your wallet\u2026"
          : busy
            ? "Withdrawing\u2026"
            : "Withdraw fees"}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
