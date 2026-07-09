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
});
