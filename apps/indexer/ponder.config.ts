import { tournamentAbi, tournamentFactoryAbi } from "@arbiter/contracts";
import { createConfig, factory } from "ponder";
import { getAbiItem } from "viem";

/**
 * Indexer configuration. Points at the same chain the web app writes to and the
 * same Postgres (`DATABASE_URL`, auto-detected by Ponder) as `@arbiter/db`, but
 * writes into its OWN schema (`ponder`, set by the `--schema` flag in the npm
 * scripts). Defaults target a local Hardhat node with a freshly deployed factory.
 */
const chainId = Number(process.env.INDEXER_CHAIN_ID ?? 31337);
const rpc = process.env.INDEXER_RPC_URL ?? "http://127.0.0.1:8545";
const startBlock = Number(process.env.INDEXER_START_BLOCK ?? 0);
const factoryAddress = process.env.INDEXER_FACTORY_ADDRESS;

if (!factoryAddress || !/^0x[a-fA-F0-9]{40}$/.test(factoryAddress)) {
  throw new Error(
    `INDEXER_FACTORY_ADDRESS must be a 0x-prefixed 20-byte address, got: ${factoryAddress ?? "undefined"}`,
  );
}

export default createConfig({
  chains: {
    arbiter: { id: chainId, rpc },
  },
  contracts: {
    TournamentFactory: {
      abi: tournamentFactoryAbi,
      chain: "arbiter",
      address: factoryAddress as `0x${string}`,
      startBlock,
    },
    // Tournament clones are created dynamically by the factory; Ponder's
    // factory pattern discovers each child address from the TournamentCreated
    // event's `tournament` param and indexes its logs (PlayerRegistered).
    Tournament: {
      abi: tournamentAbi,
      chain: "arbiter",
      address: factory({
        address: factoryAddress as `0x${string}`,
        event: getAbiItem({
          abi: tournamentFactoryAbi,
          name: "TournamentCreated",
        }),
        parameter: "tournament",
      }),
      startBlock,
    },
  },
});
