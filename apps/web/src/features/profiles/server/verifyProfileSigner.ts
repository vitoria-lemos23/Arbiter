import "server-only";
import type { ProfileDoc } from "@arbiter/db";
import { getAddress, recoverMessageAddress } from "viem";
import { buildProfileMessage } from "../lib/profileMessage";

/**
 * Recovers the wallet that signed a profile write (spec 009). The owner signs
 * the canonical message (see `profileMessage.ts`) with `personal_sign`; here we
 * rebuild that exact message from `(userAddress, doc)` and recover the signer —
 * so a signature only validates for the specific address + doc it covers.
 * Mirrors `tournaments/server/verifyOwnerSignature.ts`.
 *
 * The recover function is injected so tests can supply a deterministic fake
 * instead of exercising real ECDSA recovery.
 */

export type RecoverMessageAddress = (args: {
  message: string;
  signature: `0x${string}`;
}) => Promise<`0x${string}`>;

const defaultRecover: RecoverMessageAddress = ({ message, signature }) =>
  recoverMessageAddress({ message, signature });

/**
 * @returns the checksummed signer address. Callers lowercase it for storage and
 *          comparison (addresses are stored and compared lowercase).
 */
export async function recoverProfileSigner(
  args: {
    userAddress: `0x${string}`;
    metadata: ProfileDoc;
    signature: `0x${string}`;
  },
  recover: RecoverMessageAddress = defaultRecover,
): Promise<`0x${string}`> {
  const message = await buildProfileMessage(args.userAddress, args.metadata);
  const signer = await recover({ message, signature: args.signature });
  return getAddress(signer);
}
