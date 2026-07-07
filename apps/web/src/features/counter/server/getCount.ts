import "server-only";
import { counterAbi } from "@arbiter/contracts";
import { createPublicClient, defineChain, http } from "viem";
import { env } from "@/env";

/**
 * Server-side read access to the on-chain Counter contract.
 *
 * Reads need no signer, so they happen here for fast SSR. Writes are signed in
 * the browser by the user's wallet (see the client Counter components), so no
 * private key lives on the server.
 */

const rpcUrl = env.NEXT_PUBLIC_RPC_URL;

const chain = defineChain({
  id: env.NEXT_PUBLIC_CHAIN_ID,
  name: "Arbiter Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

const counterAddress = env.NEXT_PUBLIC_COUNTER_ADDRESS;

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

/** Reads the current counter value (`x`). */
export async function getCount(): Promise<bigint> {
  if (!counterAddress) {
    throw new Error(
      "NEXT_PUBLIC_COUNTER_ADDRESS is not set \u2014 deploy the Counter contract and set it in the environment.",
    );
  }
  return publicClient.readContract({
    address: counterAddress,
    abi: counterAbi,
    functionName: "x",
  });
}
