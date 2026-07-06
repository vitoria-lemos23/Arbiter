import "server-only";
import type { TournamentMetadataDoc } from "@arbiter/db";
import { getAddress, recoverMessageAddress } from "viem";
import { buildMetadataMessage } from "../lib/metadataMessage";

/**
 * Recovers the wallet that signed a metadata write. The organizer signs the
 * canonical message (see `metadataMessage.ts`) with `personal_sign`; here we
 * rebuild that exact message from `(address, metadata)` and recover the signer
 * — so a signature only validates for the specific address + metadata it covers.
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
 *          comparison (addresses are stored lowercase per Business Rule #1).
 */
export async function recoverMetadataSigner(
  args: {
    tournamentAddress: `0x${string}`;
    metadata: TournamentMetadataDoc;
    signature: `0x${string}`;
  },
  recover: RecoverMessageAddress = defaultRecover,
): Promise<`0x${string}`> {
  const message = await buildMetadataMessage(
    args.tournamentAddress,
    args.metadata,
  );
  const signer = await recover({ message, signature: args.signature });
  return getAddress(signer);
}
