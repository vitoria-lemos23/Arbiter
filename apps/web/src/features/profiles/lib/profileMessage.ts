import type { ProfileDoc } from "@arbiter/db";
import { canonicalJson, sha256Hex } from "@/shared/crypto";

/**
 * Builds the canonical `personal_sign` message that gates a profile write
 * (spec 009). The owner signs it client-side (wagmi `useSignMessage`); the
 * server recovers the signer from it (viem `recoverMessageAddress`) and only
 * accepts the write when the signer equals `userAddress`. Both sides MUST
 * produce a byte-for-byte identical string, so this helper is the single source
 * of truth. Mirrors `tournaments/lib/metadataMessage.ts`.
 *
 * @example
 * const message = await buildProfileMessage(address, doc);
 * const signature = await signMessageAsync({ message });
 */

/** Fixed first line; kept as one literal so client and server never drift. */
const MESSAGE_HEADER = "Arbiter \u2014 save profile";

/**
 * The canonical signed message:
 *
 *   Arbiter — save profile
 *   address: <lowercased user address>
 *   hash: <sha-256 hex of canonical-JSON(ProfileDoc)>
 */
export async function buildProfileMessage(
  userAddress: `0x${string}`,
  doc: ProfileDoc,
): Promise<string> {
  const hash = await sha256Hex(canonicalJson(doc));
  return `${MESSAGE_HEADER}\naddress: ${userAddress.toLowerCase()}\nhash: ${hash}`;
}
