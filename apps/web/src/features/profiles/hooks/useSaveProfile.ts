"use client";

import type { ProfileDoc } from "@arbiter/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignMessage } from "wagmi";
import { saveProfile } from "../actions/saveProfile";
import { buildProfileMessage } from "../lib/profileMessage";

/**
 * Owns the profile edit flow (spec 009): build the canonical profile message,
 * ask the wallet to sign it (wagmi `useSignMessage`), then persist via the
 * signature-gated `saveProfile` action. On success it refreshes the server
 * component so the edit is reflected immediately. Mirrors
 * `useUpdateTournamentMetadata`. Avatar upload happens in the form before this
 * (the doc already carries the resolved `/api/images/:id` url).
 *
 * @example
 * const { save, saving, error } = useSaveProfile(address);
 * if (await save(doc)) setEditing(false);
 */
export function useSaveProfile(userAddress: `0x${string}`) {
  const router = useRouter();
  const { signMessageAsync } = useSignMessage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(metadata: ProfileDoc): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const message = await buildProfileMessage(userAddress, metadata);
      const signature = await signMessageAsync({ message });
      const result = await saveProfile({ userAddress, metadata, signature });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Signature required to save your profile");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { save, saving, error };
}
