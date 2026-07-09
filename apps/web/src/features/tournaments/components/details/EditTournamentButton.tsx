"use client";

import type { TournamentMetadataDoc } from "@arbiter/db";
import { useState } from "react";
import { isAddress, isAddressEqual } from "viem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWalletConnect } from "@/shared/web3/hooks/useWalletConnect";
import { EditTournamentForm } from "./EditTournamentForm";

/**
 * Organizer-only entry to the metadata edit dialog. Renders nothing unless a
 * wallet is connected AND its address equals the on-chain `organizer`. This
 * visibility is UX only; the server action's signature check remains the real
 * authority (spec 004, business rule 6).
 */
export function EditTournamentButton({
  tournamentAddress,
  organizer,
  metadata,
}: {
  tournamentAddress: `0x${string}`;
  organizer: string;
  metadata: TournamentMetadataDoc | null;
}) {
  const { address } = useWalletConnect();
  const [open, setOpen] = useState(false);

  if (!address || !isAddress(organizer)) return null;
  if (!isAddressEqual(address, organizer)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit tournament</DialogTitle>
          <DialogDescription>
            Update the off-chain details. You will sign the change with your
            wallet.
          </DialogDescription>
        </DialogHeader>
        <EditTournamentForm
          tournamentAddress={tournamentAddress}
          metadata={metadata}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
