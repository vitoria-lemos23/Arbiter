"use server";

import { revalidatePath } from "next/cache";
import { isAddressEqual } from "viem";
import { z } from "zod";
import { tournamentMetadataSchema } from "../schema/metadata";
import {
  getMetadata,
  updateMetadata,
  upsertMetadata,
} from "../server/metadata";
import { recoverMetadataSigner } from "../server/verifyOwnerSignature";

/** Mirrors `CreateSampleState`: success or a single user-facing error string. */
export type SaveMetadataState = { ok?: true; error?: string };

const hexAddress = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v),
  "Invalid address",
);

const hexSignature = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]+$/.test(v),
  "Invalid signature",
);

const inputSchema = z.object({
  tournamentAddress: hexAddress,
  metadata: tournamentMetadataSchema,
  signature: hexSignature,
});

export type SaveTournamentMetadataInput = z.input<typeof inputSchema>;

/**
 * Upserts tournament presentation metadata for a predicted CREATE2 address.
 * Signature-gated (Business Rule #2): the signer recovered from the canonical
 * message becomes the row's `ownerAddress`. Called from the create wizard
 * BEFORE the creation tx (Rule #4) — a failure here aborts the tx client-side.
 */
export async function saveTournamentMetadata(
  input: SaveTournamentMetadataInput,
): Promise<SaveMetadataState> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { tournamentAddress, metadata, signature } = parsed.data;

  let signer: `0x${string}`;
  try {
    signer = await recoverMetadataSigner({
      tournamentAddress,
      metadata,
      signature,
    });
  } catch {
    return { error: "Could not verify signature" };
  }

  await upsertMetadata({
    tournamentAddress: tournamentAddress.toLowerCase(),
    ownerAddress: signer.toLowerCase(),
    metadata,
  });
  revalidatePath("/discover");
  return { ok: true };
}

/**
 * Updates existing metadata. Owner-only (Business Rule #3): the recovered signer
 * must equal the stored `ownerAddress`, else the write is rejected.
 */
export async function updateTournamentMetadata(
  input: SaveTournamentMetadataInput,
): Promise<SaveMetadataState> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { tournamentAddress, metadata, signature } = parsed.data;

  const existing = await getMetadata(tournamentAddress);
  if (!existing) return { error: "No metadata to update" };

  let signer: `0x${string}`;
  try {
    signer = await recoverMetadataSigner({
      tournamentAddress,
      metadata,
      signature,
    });
  } catch {
    return { error: "Could not verify signature" };
  }
  if (!isAddressEqual(signer, existing.ownerAddress as `0x${string}`)) {
    return { error: "Only the metadata owner may update it" };
  }

  await updateMetadata({
    tournamentAddress: tournamentAddress.toLowerCase(),
    metadata,
  });
  revalidatePath("/discover");
  return { ok: true };
}
