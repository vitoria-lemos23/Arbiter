import "server-only";
import { counterAbi } from "@arbiter/contracts";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

/**
 * Data-access functions for the on-chain Counter contract. Mirrors the shape of
 * `samples.ts`: transport-agnostic functions wrapping viem reads/writes so they
 * can be lifted into a shared package if a separate backend is needed later.
 */

const rpcUrl = process.env.RPC_URL ?? "http://127.0.0.1:8545";

const chain = defineChain({
  id: Number(process.env.CHAIN_ID ?? 31337),
  name: "Arbiter Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
});

const counterAddress = process.env.COUNTER_ADDRESS as Hex | undefined;

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

function requireAddress(): Hex {
  if (!counterAddress) {
    throw new Error(
      "COUNTER_ADDRESS is not set — deploy the Counter contract and set it in the environment.",
    );
  }
  return counterAddress;
}

function getWalletClient() {
  const key = process.env.COUNTER_PRIVATE_KEY as Hex | undefined;
  if (!key) {
    throw new Error(
      "COUNTER_PRIVATE_KEY is not set — required to send transactions to the Counter contract.",
    );
  }
  return createWalletClient({
    account: privateKeyToAccount(key),
    chain,
    transport: http(rpcUrl),
  });
}

export const incrementSchema = z.object({
  by: z.coerce.number().int().positive("Increment must be a positive integer"),
});

export type IncrementInput = z.infer<typeof incrementSchema>;

/** Reads the current counter value (`x`). */
export async function getCount(): Promise<bigint> {
  return publicClient.readContract({
    address: requireAddress(),
    abi: counterAbi,
    functionName: "x",
  });
}

/** Calls `incBy(by)` and waits for the transaction to be mined. */
export async function increment(input: IncrementInput) {
  const { by } = incrementSchema.parse(input);
  const wallet = getWalletClient();

  const hash = await wallet.writeContract({
    address: requireAddress(),
    abi: counterAbi,
    functionName: "incBy",
    args: [BigInt(by)],
  });

  return publicClient.waitForTransactionReceipt({ hash });
}
