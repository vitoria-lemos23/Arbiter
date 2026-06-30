import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("TournamentFactory", async () => {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [alice, bob] = await viem.getWalletClients();

  // Deploy a fresh implementation + factory for each test (isolated state).
  async function deployFactory() {
    const implementation = await viem.deployContract("Tournament");
    const factory = await viem.deployContract("TournamentFactory", [
      implementation.address,
    ]);
    return { implementation, factory };
  }

  async function makeParams() {
    const now = BigInt(await networkHelpers.time.latest());
    return {
      format: 0, // SingleElimination
      maxPlayers: 8,
      entryFee: 1_000_000_000_000_000_000n,
      startDate: now + 1_000n,
      endDate: now + 2_000n,
      judges: [] as `0x${string}`[],
    };
  }

  // createTournament returns the clone address, but a write tx resolves to a
  // hash — recover the address from the TournamentCreated event.
  async function createAndGetAddress(
    factory: Awaited<ReturnType<typeof deployFactory>>["factory"],
    params: Awaited<ReturnType<typeof makeParams>>,
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

  it("emits TournamentCreated with the caller as organizer and index 0", async () => {
    const { factory } = await networkHelpers.loadFixture(deployFactory);
    const params = await makeParams();

    await viem.assertions.emitWithArgs(
      factory.write.createTournament([params], { account: alice.account }),
      factory,
      "TournamentCreated",
      // clone address isn't known ahead of time — match it with a predicate
      [() => true, getAddress(alice.account.address), 0n],
    );
  });

  it("creates a real clone whose details match the input", async () => {
    const { factory } = await networkHelpers.loadFixture(deployFactory);
    const params = await makeParams();
    const address = await createAndGetAddress(factory, params, alice.account);

    const clone = await viem.getContractAt("Tournament", address);
    const [
      organizer,
      format,
      maxPlayers,
      entryFee,
      startDate,
      endDate,
      judges,
    ] = await clone.read.details();

    assert.equal(organizer, getAddress(alice.account.address));
    assert.equal(format, params.format);
    assert.equal(maxPlayers, params.maxPlayers);
    assert.equal(entryFee, params.entryFee);
    assert.equal(startDate, params.startDate);
    assert.equal(endDate, params.endDate);
    assert.deepEqual(judges, []);
  });

  it("isolates storage between tournaments from different organizers", async () => {
    const { factory } = await networkHelpers.loadFixture(deployFactory);
    const aliceParams = await makeParams();
    const bobParams = { ...aliceParams, maxPlayers: 4, entryFee: 0n };

    const aAddr = await createAndGetAddress(
      factory,
      aliceParams,
      alice.account,
    );
    const bAddr = await createAndGetAddress(factory, bobParams, bob.account);

    assert.notEqual(aAddr, bAddr);

    const a = await viem.getContractAt("Tournament", aAddr);
    const b = await viem.getContractAt("Tournament", bAddr);

    assert.equal(await a.read.organizer(), getAddress(alice.account.address));
    assert.equal(await b.read.organizer(), getAddress(bob.account.address));
    assert.equal(await a.read.maxPlayers(), 8);
    assert.equal(await b.read.maxPlayers(), 4);
    assert.equal(await a.read.entryFee(), aliceParams.entryFee);
    assert.equal(await b.read.entryFee(), 0n);
  });

  it("tracks the registry: count, indexed access, and per-organizer lookup", async () => {
    const { factory } = await networkHelpers.loadFixture(deployFactory);
    const params = await makeParams();

    const a1 = await createAndGetAddress(factory, params, alice.account);
    const a2 = await createAndGetAddress(factory, params, alice.account);
    const b1 = await createAndGetAddress(factory, params, bob.account);

    assert.equal(await factory.read.tournamentCount(), 3n);
    assert.equal(await factory.read.tournamentAt([0n]), a1);
    assert.equal(await factory.read.tournamentAt([2n]), b1);

    const aliceTournaments = await factory.read.tournamentsOf([
      alice.account.address,
    ]);
    assert.deepEqual(aliceTournaments, [a1, a2]);
    assert.deepEqual(await factory.read.tournamentsOf([bob.account.address]), [
      b1,
    ]);
  });

  it("paginates getTournaments and clamps at the boundaries", async () => {
    const { factory } = await networkHelpers.loadFixture(deployFactory);
    const params = await makeParams();

    const created: `0x${string}`[] = [];
    for (let i = 0; i < 3; i++) {
      created.push(await createAndGetAddress(factory, params, alice.account));
    }

    assert.deepEqual(await factory.read.getTournaments([0n, 2n]), [
      created[0],
      created[1],
    ]);
    // limit clamps to the available tail
    assert.deepEqual(await factory.read.getTournaments([2n, 10n]), [
      created[2],
    ]);
    // offset past the end yields an empty array
    assert.deepEqual(await factory.read.getTournaments([3n, 5n]), []);
  });
});
