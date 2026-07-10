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
  const [organizer, alice, bob, judge] = await viem.getWalletClients();

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
          judges: [judge.account.address] as `0x${string}`[],
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

/**
 * Full single-elimination lifecycle through judge voting (#007): 8 players, a
 * 3-judge panel, and a deposited prize. Drives every state transition the web
 * app's `useCastVote` / `useWithdrawFees` hooks exercise, asserting event args,
 * champion, prize push, and fee withdrawal balances.
 */
describe("Tournament voting lifecycle", async () => {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();
  const clients = await viem.getWalletClients();
  const organizer = clients[0];
  const players = clients.slice(1, 9); // p0..p7
  const judges = clients.slice(9, 12); // 3 judges

  const ENTRY_FEE = parseEther("1");
  const PRIZE = parseEther("2");

  let saltNonce = 100;
  function nextSalt() {
    return toHex(++saltNonce, { size: 32 });
  }

  // Fresh 8-player, prize-funded tournament with all 8 players registered.
  async function deployAndFill() {
    const implementation = await viem.deployContract("Tournament");
    const factory = await viem.deployContract("TournamentFactory", [
      implementation.address,
    ]);
    const now = BigInt(await networkHelpers.time.latest());
    const salt = nextSalt();
    const predicted = await factory.read.predictTournamentAddress([salt]);
    await factory.write.createTournament(
      [
        {
          format: 0,
          maxPlayers: 8,
          entryFee: ENTRY_FEE,
          startDate: now + 10_000n,
          endDate: now + 20_000n,
          judges: judges.map((j) => getAddress(j.account.address)),
        },
        salt,
      ],
      { account: organizer.account, value: PRIZE },
    );
    const tournament = await viem.getContractAt("Tournament", predicted);
    for (const p of players) {
      await tournament.write.register({ account: p.account, value: ENTRY_FEE });
    }
    return { tournament };
  }

  // Two of three judges agree, triggering auto-resolution.
  async function resolve(
    tournament: Awaited<ReturnType<typeof deployAndFill>>["tournament"],
    matchIndex: number,
    winner: `0x${string}`,
  ) {
    await tournament.write.castVote([BigInt(matchIndex), winner], {
      account: judges[0].account,
    });
    await tournament.write.castVote([BigInt(matchIndex), winner], {
      account: judges[1].account,
    });
  }

  const addr = (i: number) => getAddress(players[i].account.address);

  it("runs the whole bracket to a champion, prize, and fee withdrawal", async () => {
    const { tournament } = await networkHelpers.loadFixture(deployAndFill);

    assert.equal(await tournament.read.status(), 1); // Active
    assert.equal(
      await publicClient.getBalance({ address: tournament.address }),
      PRIZE + 8n * ENTRY_FEE,
    );

    // Round 1 (leaves 3..6): p0, p3, p1, p2 advance.
    await resolve(tournament, 3, addr(0)); // p0 beats p7
    await resolve(tournament, 4, addr(3)); // p3 beats p4
    await resolve(tournament, 5, addr(1)); // p1 beats p6
    await resolve(tournament, 6, addr(2)); // p2 beats p5

    // Votes are public and tallied.
    assert.equal(await tournament.read.getVotesFor([3n, addr(0)]), 2);
    assert.equal(
      await tournament.read.getVote([3n, judges[0].account.address]),
      addr(0),
    );

    // Semis auto-activated (index 1 = p0 vs p3, index 2 = p1 vs p2).
    const semis = await tournament.read.getMatches([1n, 2n]);
    assert.equal(semis[0].status, 1); // Active
    assert.equal(semis[0].playerA.toLowerCase(), addr(0).toLowerCase());
    assert.equal(semis[0].playerB.toLowerCase(), addr(3).toLowerCase());

    await resolve(tournament, 1, addr(0)); // p0 beats p3
    await resolve(tournament, 2, addr(1)); // p1 beats p2

    // Final (index 0) = p0 vs p1. First vote does not resolve.
    await tournament.write.castVote([0n, addr(0)], {
      account: judges[0].account,
    });
    const balanceBefore = await publicClient.getBalance({
      address: players[0].account.address,
    });

    // The resolving vote completes the tournament and pushes the prize.
    const resolving = tournament.write.castVote([0n, addr(0)], {
      account: judges[1].account,
    });
    await viem.assertions.emitWithArgs(
      resolving,
      tournament,
      "TournamentCompleted",
      [addr(0)],
    );

    assert.equal(await tournament.read.status(), 2); // Completed
    assert.equal(
      (await tournament.read.champion()).toLowerCase(),
      addr(0).toLowerCase(),
    );

    const balanceAfter = await publicClient.getBalance({
      address: players[0].account.address,
    });
    assert.equal(balanceAfter - balanceBefore, PRIZE);

    // Only the entry fees remain; the organizer withdraws them.
    assert.equal(
      await publicClient.getBalance({ address: tournament.address }),
      8n * ENTRY_FEE,
    );
    await viem.assertions.emitWithArgs(
      tournament.write.withdrawFees({ account: organizer.account }),
      tournament,
      "FeesWithdrawn",
      [getAddress(organizer.account.address), 8n * ENTRY_FEE],
    );
    assert.equal(
      await publicClient.getBalance({ address: tournament.address }),
      0n,
    );
  });

  it("rejects a vote from a non-judge", async () => {
    const { tournament } = await networkHelpers.loadFixture(deployAndFill);
    await viem.assertions.revertWithCustomError(
      tournament.write.castVote([3n, addr(0)], { account: players[0].account }),
      tournament,
      "NotJudge",
    );
  });
});
