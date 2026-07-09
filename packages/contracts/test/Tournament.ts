import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress, parseEther, toHex } from "viem";

/**
 * End-to-end registration flow through the factory: deploy factory + clone,
 * register from independent wallet clients with the entry fee as `value`, and
 * assert event args, roster ordering, and fee custody — the path the web app's
 * `useRegisterForTournament` exercises.
 */
describe("Tournament registration", async () => {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [organizer, alice, bob] = await viem.getWalletClients();

  const ENTRY_FEE = parseEther("1");

  // Distinct 32-byte salt per call so CREATE2 addresses never collide.
  let saltNonce = 0;
  function nextSalt() {
    return toHex(++saltNonce, { size: 32 });
  }

  // Fresh factory + one paid 4-player tournament per test (isolated state).
  async function deployTournament() {
    const implementation = await viem.deployContract("Tournament");
    const factory = await viem.deployContract("TournamentFactory", [
      implementation.address,
    ]);
    const now = BigInt(await networkHelpers.time.latest());
    const startDate = now + 1_000n;
    const salt = nextSalt();
    const predicted = await factory.read.predictTournamentAddress([salt]);
    await factory.write.createTournament(
      [
        {
          format: 0, // SingleElimination
          maxPlayers: 4,
          entryFee: ENTRY_FEE,
          startDate,
          endDate: startDate + 1_000n,
          judges: [] as `0x${string}`[],
        },
        salt,
      ],
      { account: organizer.account },
    );
    const tournament = await viem.getContractAt("Tournament", predicted);
    return { tournament, startDate };
  }

  it("emits PlayerRegistered with the caller, position, and fee", async () => {
    const { tournament } = await networkHelpers.loadFixture(deployTournament);

    await viem.assertions.emitWithArgs(
      tournament.write.register({ account: alice.account, value: ENTRY_FEE }),
      tournament,
      "PlayerRegistered",
      [getAddress(alice.account.address), 0, ENTRY_FEE],
    );
    await viem.assertions.emitWithArgs(
      tournament.write.register({ account: bob.account, value: ENTRY_FEE }),
      tournament,
      "PlayerRegistered",
      [getAddress(bob.account.address), 1, ENTRY_FEE],
    );
  });

  it("orders the roster by registration and holds the fees", async () => {
    const { tournament } = await networkHelpers.loadFixture(deployTournament);

    await tournament.write.register({
      account: alice.account,
      value: ENTRY_FEE,
    });
    await tournament.write.register({
      account: bob.account,
      value: ENTRY_FEE,
    });

    assert.equal(await tournament.read.participantCount(), 2n);
    assert.deepEqual(await tournament.read.getParticipants([0n, 10n]), [
      getAddress(alice.account.address),
      getAddress(bob.account.address),
    ]);
    assert.equal(
      await tournament.read.isRegistered([alice.account.address]),
      true,
    );
    assert.equal(
      await publicClient.getBalance({ address: tournament.address }),
      ENTRY_FEE * 2n,
    );
  });

  it("reverts once the start date is reached", async () => {
    const { tournament, startDate } =
      await networkHelpers.loadFixture(deployTournament);

    await networkHelpers.time.increaseTo(startDate);
    await viem.assertions.revertWithCustomError(
      tournament.write.register({ account: alice.account, value: ENTRY_FEE }),
      tournament,
      "RegistrationClosed",
    );
  });

  it("rejects a wrong fee with the provided and required values", async () => {
    const { tournament } = await networkHelpers.loadFixture(deployTournament);

    await viem.assertions.revertWithCustomErrorWithArgs(
      tournament.write.register({ account: alice.account, value: 1n }),
      tournament,
      "IncorrectEntryFee",
      [1n, ENTRY_FEE],
    );
  });

  it("generates a bracket automatically when the field fills", async () => {
    const { tournament } = await networkHelpers.loadFixture(deployTournament);
    const clients = await viem.getWalletClients();
    // We already have bob, charlie, dave, alice? Wait, let's use the clients array.
    // clients[1] to clients[4] are usually valid accounts.
    const players = clients.slice(1, 5);

    // Register first 3 players
    for (let i = 0; i < 3; i++) {
      await tournament.write.register({
        account: players[i].account,
        value: ENTRY_FEE,
      });
    }

    assert.equal(await tournament.read.bracketGenerated(), false);
    assert.equal(await tournament.read.matchCount(), 0n);

    const registerPromise = tournament.write.register({
      account: players[3].account,
      value: ENTRY_FEE,
    });

    // Check the event
    await viem.assertions.emitWithArgs(
      registerPromise,
      tournament,
      "BracketGenerated",
      [
        4,
        [
          players[0].account.address,
          players[3].account.address,
          players[1].account.address,
          players[2].account.address,
        ].map((a) => getAddress(a)),
      ],
    );

    assert.equal(await tournament.read.bracketGenerated(), true);
    assert.equal(await tournament.read.matchCount(), 3n);

    // Check tree shape via getMatches
    const matches = await tournament.read.getMatches([0n, 3n]);
    assert.equal(matches.length, 3);

    // internal node
    assert.equal(
      matches[0].playerA,
      "0x0000000000000000000000000000000000000000",
    );

    // leaves
    assert.equal(
      matches[1].playerA.toLowerCase(),
      players[0].account.address.toLowerCase(),
    );
    assert.equal(
      matches[1].playerB.toLowerCase(),
      players[3].account.address.toLowerCase(),
    );
    assert.equal(
      matches[2].playerA.toLowerCase(),
      players[1].account.address.toLowerCase(),
    );
    assert.equal(
      matches[2].playerB.toLowerCase(),
      players[2].account.address.toLowerCase(),
    );
  });
});
