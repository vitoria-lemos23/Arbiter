import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Details-page CTA to the registration screen (replaces the inert
 * JoinTournamentButton). Enabled only while the window is open and capacity
 * remains, per the indexed data; the register screen re-checks on-chain.
 */
export function RegisterLink({
  tournamentAddress,
  isOpen,
  isFull,
}: {
  tournamentAddress: string;
  isOpen: boolean;
  isFull: boolean;
}) {
  if (isOpen && !isFull) {
    return (
      <Button asChild>
        <Link href={`/tournaments/${tournamentAddress}/register`}>
          Register
        </Link>
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button type="button" disabled className="cursor-not-allowed">
        Register
      </Button>
      <p className="text-xs text-muted-foreground">
        {isOpen ? "Tournament is full." : "Registration is closed."}
      </p>
    </div>
  );
}
