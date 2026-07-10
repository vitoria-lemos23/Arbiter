"use server";

import { revalidatePath } from "next/cache";
import { isAddressEqual } from "viem";
import { z } from "zod";
import { profileDocSchema } from "../schema/profile";
import { upsertProfile } from "../server/profileStore";
import { recoverProfileSigner } from "../server/verifyProfileSigner";

/**
 * The `saveProfile` server action (spec 009): the only write path for a
 * profile. Self-authenticating — a write is accepted only when the recovered
 * `personal_sign` signer equals the `userAddress` being written. Mirrors
 * `saveTournamentMetadata`'s signature-gated update path; there is no admin
 * override and no REST endpoint.
 */

const hexAddress = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v),
  "Invalid address",
);

const hexSignature = z.custom<`0x${string}`>(
  (v) => typeof v === "string" && /^0x[a-fA-F0-9]+$/.test(v),
  "Invalid signature",
);

const inputSchema = z.object({
  userAddress: hexAddress,
  metadata: profileDocSchema,
  signature: hexSignature,
});

export type SaveProfileInput = z.input<typeof inputSchema>;
export type SaveProfileResult = { ok: true } | { ok: false; error: string };

export async function saveProfile(
  input: SaveProfileInput,
): Promise<SaveProfileResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { userAddress, metadata, signature } = parsed.data;

  let signer: `0x${string}`;
  try {
    signer = await recoverProfileSigner({ userAddress, metadata, signature });
  } catch {
    return { ok: false, error: "Could not verify signature" };
  }
  if (!isAddressEqual(signer, userAddress)) {
    return { ok: false, error: "Only the address owner may edit this profile" };
  }

  await upsertProfile({ userAddress: userAddress.toLowerCase(), metadata });
  // Reflect the edit on the owner's own page and its public counterpart.
  revalidatePath("/profile");
  revalidatePath("/profile/[address]", "page");
  return { ok: true };
}
