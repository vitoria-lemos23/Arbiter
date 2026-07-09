"use client";

import type { TournamentMetadataDoc } from "@arbiter/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignMessage } from "wagmi";
import { updateTournamentMetadata } from "../actions/saveTournamentMetadata";
import { buildMetadataMessage } from "../lib/metadataMessage";

/**
 * Owns the organizer edit flow: build the canonical metadata message, ask the
 * wallet to sign it (wagmi `useSignMessage`), then persist via the signature-
 * gated `updateTournamentMetadata` action. On success it refreshes the server
 * component so the edit is reflected immediately.
 *
 * @example
 * const { save, saving, error } = useUpdateTournamentMetadata(address);
 * if (await save(doc)) closeDialog();
 */
export function useUpdateTournamentMetadata(tournamentAddress: `0x${string}`) {
  const router = useRouter();
  const { signMessageAsync } = useSignMessage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(metadata: TournamentMetadataDoc): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const message = await buildMetadataMessage(tournamentAddress, metadata);
      const signature = await signMessageAsync({ message });
      const result = await updateTournamentMetadata({
        tournamentAddress,
        metadata,
        signature,
      });
      if (!result.ok) {
        setError(result.error ?? "Failed to save changes.");
        return false;
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature was rejected");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { save, saving, error };
}
