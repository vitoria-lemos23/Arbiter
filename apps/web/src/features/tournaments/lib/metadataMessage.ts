import type { TournamentMetadataDoc } from "@arbiter/db";
import { canonicalJson, sha256Hex } from "@/shared/crypto";

/**
 * Builds the canonical `personal_sign` message that gates a metadata write. The
 * organizer signs it client-side (wagmi `useSignMessage`); the server recovers
 * the signer from it (viem `recoverMessageAddress`). Both sides MUST produce a
 * byte-for-byte identical string, so this helper is the single source of truth.
 * The canonical-JSON + sha-256 primitives are shared with the profile signing
 * flow (see `@/shared/crypto`); re-exported here for existing callers/tests.
 *
 * @example
 * const message = await buildMetadataMessage(address, metadata);
 * const signature = await signMessageAsync({ message });
 */

export { canonicalJson, sha256Hex };

/** Fixed first line; kept as one literal so client and server never drift. */
const MESSAGE_HEADER = "Arbiter \u2014 save tournament metadata";

/**
 * The canonical signed message:
 *
 *   Arbiter — save tournament metadata
 *   address: <lowercased tournament address>
 *   hash: <sha-256 hex of canonical-JSON(metadata)>
 */
export async function buildMetadataMessage(
  address: `0x${string}`,
  metadata: TournamentMetadataDoc,
): Promise<string> {
  const hash = await sha256Hex(canonicalJson(metadata));
  return `${MESSAGE_HEADER}\naddress: ${address.toLowerCase()}\nhash: ${hash}`;
}
