import "server-only";
import { counterAbi } from "@arbiter/contracts";
import { createPublicClient, defineChain, type Hex, http } from "viem";

/**
 * Server-side read access to the on-chain Counter contract.
 *
 * Reads need no signer, so they happen here for fast SSR. Writes are signed in
 * the browser by the user's wallet (see the client Counter components), so no
 * private key lives on the server.
 */

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

const chain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337),
  name: "Arbiter Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

const counterAddress = process.env.NEXT_PUBLIC_COUNTER_ADDRESS as
  | Hex
  | undefined;

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

/** Reads the current counter value (`x`). */
export async function getCount(): Promise<bigint> {
  if (!counterAddress) {
    throw new Error(
      "NEXT_PUBLIC_COUNTER_ADDRESS is not set — deploy the Counter contract and set it in the environment.",
    );
  }
  return publicClient.readContract({
    address: counterAddress,
    abi: counterAbi,
    functionName: "x",
  });
}
