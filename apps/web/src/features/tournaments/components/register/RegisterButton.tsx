"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/shared/web3/components/WalletConnect";
import type { RegistrationGate } from "../../lib/registrationGating";

/**
 * Stateful registration CTA (spec 005 edge-case table): connect prompt, switch
 * network, closed/full/already-registered blocks, free vs paid label, tx
 * progress, and the post-mine success state. Purely presentational — all state
 * comes from `useRegisterForTournament` via the parent panel.
 */
export function RegisterButton({
  gate,
  free,
  rulesAccepted,
  busy,
  isPending,
  isSuccess,
  tournamentHref,
  onRegister,
  onSwitchNetwork,
}: {
  gate: RegistrationGate;
  free: boolean;
  rulesAccepted: boolean;
  busy: boolean;
  isPending: boolean;
  isSuccess: boolean;
  tournamentHref: string;
  onRegister: () => void;
  onSwitchNetwork: () => void;
}) {
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">
          You are registered! Your address is on the roster.
        </p>
        <Button asChild variant="outline">
          <Link href={tournamentHref}>Back to the tournament</Link>
        </Button>
      </div>
    );
  }
  if (gate === "disconnected") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Connect a wallet to register.
        </p>
        <WalletConnect />
      </div>
    );
  }
  if (gate === "wrong-chain") {
    return (
      <Button type="button" onClick={onSwitchNetwork}>
        Switch network
      </Button>
    );
  }

  const blockedMessage = {
    closed: "Registration is closed.",
    full: "Tournament is full.",
    "already-registered": "You are already registered.",
    open: null,
  }[gate];

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        disabled={Boolean(blockedMessage) || !rulesAccepted || busy}
        onClick={onRegister}
      >
        {registerLabel({ free, busy, isPending })}
      </Button>
      {blockedMessage ? (
        <p className="text-xs text-muted-foreground">{blockedMessage}</p>
      ) : null}
    </div>
  );
}

function registerLabel(state: {
  free: boolean;
  busy: boolean;
  isPending: boolean;
}): string {
  if (state.isPending) return "Confirm in your wallet\u2026";
  if (state.busy) return "Registering\u2026";
  return state.free ? "Register" : "Register & sign";
}
