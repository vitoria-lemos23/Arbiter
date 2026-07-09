import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { tournamentAbi, tournamentFactoryAbi } from "@arbiter/contracts";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  parseEther,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

// Standard Hardhat local test accounts
const privateKeys = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account #0 (Organizer)
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account #2
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account #3
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account #4
];

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(rpcUrl),
});

async function main() {
  const accounts = privateKeys.map((pk) =>
    privateKeyToAccount(pk as `0x${string}`),
  );
  const clients = accounts.map((account) =>
    createWalletClient({
      account,
      chain: hardhat,
      transport: http(rpcUrl),
    }),
  );

  const organizerClient = clients[0];
  const playerClients = clients.slice(1, 5);

  const envFactory = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
  if (!envFactory) {
    throw new Error("NEXT_PUBLIC_FACTORY_ADDRESS is missing in .env");
  }

  const factoryAddress = envFactory as `0x${string}`;
  const bytecode = await publicClient.getBytecode({ address: factoryAddress });

  if (!bytecode || bytecode === "0x") {
    throw new Error(
      `TournamentFactory not found at ${factoryAddress}. Please start the local node and deploy contracts first.`,
    );
  }

  console.log(`Using TournamentFactory at ${factoryAddress}`);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const entryFee = parseEther("0.01");

  const params = {
    format: 0, // SingleElimination
    maxPlayers: 4,
    entryFee,
    startDate: now + 86400n, // starts tomorrow
    endDate: now + 86400n * 2n,
    judges: [getAddress(organizerClient.account.address)] as `0x${string}`[],
  };

  const salt = toHex(Date.now(), { size: 32 });

  console.log("Creating 4-player tournament...");
  const createTx = await organizerClient.writeContract({
    address: factoryAddress,
    abi: tournamentFactoryAbi,
    functionName: "createTournament",
    args: [params, salt],
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: createTx,
  });

  const logs = await publicClient.getContractEvents({
    address: factoryAddress,
    abi: tournamentFactoryAbi,
    eventName: "TournamentCreated",
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
    strict: true,
  });

  if (!logs || logs.length === 0) {
    throw new Error("TournamentCreated event not found in receipt.");
  }

  const tournamentAddress = logs[0].args.tournament;
  console.log(`\nTournament created at: ${tournamentAddress}`);

  console.log("\nRegistering 4 players...");
  for (let i = 0; i < playerClients.length; i++) {
    const playerClient = playerClients[i];
    const txHash = await playerClient.writeContract({
      address: tournamentAddress,
      abi: tournamentAbi,
      functionName: "register",
      value: entryFee,
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(
      `  Player ${i + 1} (${playerClient.account.address}) registered.`,
    );
  }

  const generated = await publicClient.readContract({
    address: tournamentAddress,
    abi: tournamentAbi,
    functionName: "bracketGenerated",
  });

  if (generated) {
    console.log("\n✅ Bracket successfully generated!");
    const matchCount = await publicClient.readContract({
      address: tournamentAddress,
      abi: tournamentAbi,
      functionName: "matchCount",
    });
    console.log(`  Total Matches: ${matchCount}`);
  } else {
    console.log("\n❌ Bracket generation failed or field is not full.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
