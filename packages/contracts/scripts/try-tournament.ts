// Throwaway script to feel out TournamentFactory end-to-end against a fresh
// in-process simulated chain. Run with:
//   pnpm --filter @arbiter/contracts exec hardhat run scripts/try-tournament.ts
//
// It deploys the implementation + factory, creates a free tournament and a
// paid one from two different accounts, then reads the registry back and proves
// the two clones don't leak each other's config. Not a test — just a sandbox.

import { network } from "hardhat";
import { getAddress } from "viem";

const { viem, networkHelpers } = await network.create();
const publicClient = await viem.getPublicClient();
const [alice, bob] = await viem.getWalletClients();

console.log("Deploying Tournament implementation + factory…");
const implementation = await viem.deployContract("Tournament");
const factory = await viem.deployContract("TournamentFactory", [
  implementation.address,
]);
console.log("  implementation:", implementation.address);
console.log("  factory:       ", factory.address);

const now = BigInt(await networkHelpers.time.latest());
const baseParams = {
  format: 0, // SingleElimination
  maxPlayers: 8,
  entryFee: 0n, // free tournament
  startDate: now + 3_600n, // starts in 1h
  endDate: now + 7_200n, // ends in 2h
  judges: [] as `0x${string}`[],
};

// createTournament returns the clone address on-chain, but a write tx resolves
// to a hash — recover the address from the TournamentCreated event.
async function createTournament(
  params: typeof baseParams,
  account: (typeof alice)["account"],
) {
  const hash = await factory.write.createTournament([params], { account });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const [log] = await publicClient.getContractEvents({
    address: factory.address,
    abi: factory.abi,
    eventName: "TournamentCreated",
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
    strict: true,
  });
  return log.args.tournament;
}

console.log("\nAlice creates a free 8-player tournament…");
const aliceTournament = await createTournament(baseParams, alice.account);
console.log("  ->", aliceTournament);

console.log("\nBob creates a paid 4-player tournament (0.05 ETH entry)…");
const bobTournament = await createTournament(
  {
    ...baseParams,
    maxPlayers: 4,
    entryFee: 50_000_000_000_000_000n, // 0.05 ETH in wei
    judges: [getAddress(alice.account.address)], // Alice judges Bob's event
  },
  bob.account,
);
console.log("  ->", bobTournament);

console.log("\nRegistry:");
console.log("  tournamentCount:", await factory.read.tournamentCount());
console.log("  tournamentAt(0):", await factory.read.tournamentAt([0n]));
console.log("  tournamentAt(1):", await factory.read.tournamentAt([1n]));
console.log(
  "  getTournaments(0, 10):",
  await factory.read.getTournaments([0n, 10n]),
);
console.log(
  "  tournamentsOf(alice):",
  await factory.read.tournamentsOf([alice.account.address]),
);
console.log(
  "  tournamentsOf(bob):  ",
  await factory.read.tournamentsOf([bob.account.address]),
);

// Isolation check: each clone owns its own storage.
const aliceClone = await viem.getContractAt("Tournament", aliceTournament);
const bobClone = await viem.getContractAt("Tournament", bobTournament);

console.log("\nAlice's tournament details():");
console.log("  ", await aliceClone.read.details());
console.log("Bob's tournament details():");
console.log("  ", await bobClone.read.details());

console.log("\nIsolation holds:");
console.log(
  "  organizers differ:",
  (await aliceClone.read.organizer()) !== (await bobClone.read.organizer()),
);
console.log(
  "  entry fees differ:",
  (await aliceClone.read.entryFee()) !== (await bobClone.read.entryFee()),
);
console.log("  alice judges:", await aliceClone.read.getJudges());
console.log("  bob judges:  ", await bobClone.read.getJudges());
