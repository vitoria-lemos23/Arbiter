"use client";

import { useState } from "react";
import type { Address } from "viem";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRegisterForTournament } from "../../hooks/useRegisterForTournament";
import { ethLabel } from "../../lib/formatTournament";
import { RegisterButton } from "./RegisterButton";

/**
 * Interactive half of the registration screen: rules-acceptance checkbox (a
 * client-side gate only, spec 005 decision log) and the register CTA wired to
 * `useRegisterForTournament`. Entry fee arrives as a wei string because server
 * components cannot pass bigint props.
 */
export function RegisterPanel({
  tournamentAddress,
  entryFeeWei,
  maxPlayers,
  startDate,
}: {
  tournamentAddress: Address;
  entryFeeWei: string;
  maxPlayers: number;
  startDate: Date;
}) {
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const entryFee = BigInt(entryFeeWei);
  const free = entryFee === BigInt(0);
  const {
    gate,
    busy,
    isPending,
    isSuccess,
    errorMessage,
    register,
    switchNetwork,
  } = useRegisterForTournament({
    tournamentAddress,
    entryFee,
    maxPlayers,
    startDate,
  });

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-input p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Register to play
        </h2>
        <p className="text-sm text-muted-foreground">
          Joining is recorded on-chain: your wallet address is added to the
          roster and cannot be removed in this version.
        </p>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="accept-rules"
          checked={rulesAccepted}
          onCheckedChange={(checked) => setRulesAccepted(checked === true)}
          disabled={isSuccess}
        />
        <Label htmlFor="accept-rules" className="leading-snug font-normal">
          I have read and accept the tournament rules {"&"} judging policy
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <RegisterButton
          gate={gate}
          free={free}
          rulesAccepted={rulesAccepted}
          busy={busy}
          isPending={isPending}
          isSuccess={isSuccess}
          tournamentHref={`/tournaments/${tournamentAddress}`}
          onRegister={register}
          onSwitchNetwork={switchNetwork}
        />
        {!isSuccess ? (
          <p className="text-xs text-muted-foreground">
            {free
              ? "This tournament is free to enter."
              : `You will pay the ${ethLabel(entryFeeWei)} entry fee with this transaction.`}{" "}
            Network gas fees apply.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
