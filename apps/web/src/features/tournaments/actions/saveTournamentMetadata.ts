"use server";

import { revalidatePath } from "next/cache";
import { isAddressEqual } from "viem";
import { z } from "zod";
import { tournamentMetadataSchema } from "../schema/metadata";
import {
  createMetadata,
  getMetadata,
  updateMetadata,
} from "../server/metadata";
import { recoverMetadataSigner } from "../server/verifyOwnerSignature";
import { organizerFromCreationTx } from "../server/verifyTournamentTx";

/** Mirrors `CreateSampleState`: success or a single user-facing error string. */
export type SaveMetadataState = { ok?: true; error?: string };

const hexAddress = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v),
  "Invalid address",
);

const hexTxHash = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]{64}$/.test(v),
  "Invalid transaction hash",
);

const hexSignature = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]+$/.test(v),
  "Invalid signature",
);

const createInputSchema = z.object({
  tournamentAddress: hexAddress,
  metadata: tournamentMetadataSchema,
  txHash: hexTxHash,
});

const updateInputSchema = z.object({
  tournamentAddress: hexAddress,
  metadata: tournamentMetadataSchema,
  signature: hexSignature,
});

export type SaveTournamentMetadataInput = z.input<typeof createInputSchema>;
export type UpdateTournamentMetadataInput = z.input<typeof updateInputSchema>;

/**
 * Persists tournament presentation metadata after its creation tx mines. The
 * writer's authority comes from the transaction itself: the recorded owner is
 * the on-chain organizer emitted by `TournamentCreated`, and the row is only
 * created if absent (creation is one-shot). Called from the wizard once the
 * single creation tx confirms.
 */
export async function saveTournamentMetadata(
  input: SaveTournamentMetadataInput,
): Promise<SaveMetadataState> {
  const parsed = createInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { tournamentAddress, metadata, txHash } = parsed.data;

  let organizer: `0x${string}`;
  try {
    organizer = await organizerFromCreationTx({ tournamentAddress, txHash });
  } catch {
    return { error: "Could not verify the creation transaction" };
  }

  await createMetadata({
    tournamentAddress: tournamentAddress.toLowerCase(),
    ownerAddress: organizer.toLowerCase(),
    metadata,
  });
  revalidatePath("/discover");
  return { ok: true };
}

/**
 * Updates existing metadata. Owner-only: the recovered signer must equal the
 * stored `ownerAddress`, else the write is rejected.
 */
export async function updateTournamentMetadata(
  input: UpdateTournamentMetadataInput,
): Promise<SaveMetadataState> {
  const parsed = updateInputSchema.safeParse(input);
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
