"use client";

import { Button } from "@/components/ui/button";

/**
 * Inert Join CTA. Enrollment does not exist yet and entry fees are not collected
 * on-chain, so this is always disabled with an explanatory message. The layout
 * is the eligibility-message shell a future enrollment spec will fill in; it
 * must never submit a transaction.
 */
export function JoinTournamentButton() {
  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button type="button" disabled className="cursor-not-allowed">
        Join tournament
      </Button>
      <p className="text-xs text-muted-foreground">
        Registration is not open yet.
      </p>
    </div>
  );
}
