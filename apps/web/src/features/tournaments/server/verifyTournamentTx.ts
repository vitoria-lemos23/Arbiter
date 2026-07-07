import "server-only";
import { tournamentFactoryAbi } from "@arbiter/contracts";
import {
  createPublicClient,
  getAddress,
  http,
  isAddressEqual,
  parseEventLogs,
} from "viem";
import { env } from "@/env";
import { tournamentFactoryAddress } from "@/shared/web3/config/wagmi";

/**
 * Server-side proof that a creation tx really minted a given tournament, used to
 * authorize its off-chain metadata write. The organizer is read from the
 * `TournamentCreated` event the factory emitted — the on-chain source of truth —
 * rather than trusted from the client, so the recorded owner always matches the
 * chain.
 */

const publicClient = createPublicClient({
  transport: http(env.NEXT_PUBLIC_RPC_URL),
});

/**
 * @returns the checksummed organizer address of the tournament the tx created.
 * @throws if the tx did not succeed or did not create `tournamentAddress`.
 */
export async function organizerFromCreationTx(args: {
  tournamentAddress: `0x${string}`;
  txHash: `0x${string}`;
}): Promise<`0x${string}`> {
  const receipt = await publicClient.getTransactionReceipt({
    hash: args.txHash,
  });
  if (receipt.status !== "success") {
    throw new Error(`Creation tx ${args.txHash} did not succeed`);
  }
  const events = parseEventLogs({
    abi: tournamentFactoryAbi,
    eventName: "TournamentCreated",
    logs: receipt.logs,
  });
  const created = events.find(
    (event) =>
      (!tournamentFactoryAddress ||
        isAddressEqual(event.address, tournamentFactoryAddress)) &&
      isAddressEqual(event.args.tournament, args.tournamentAddress),
  );
  if (!created) {
    throw new Error(
      `Tx ${args.txHash} did not create tournament ${args.tournamentAddress}`,
    );
  }
  return getAddress(created.args.organizer);
}
