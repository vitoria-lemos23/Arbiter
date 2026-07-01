"use client";

import { tournamentFactoryAbi } from "@arbiter/contracts";
import { useState } from "react";
import { type Address, getContractAddress, type Hex, toHex } from "viem";
import {
  useChainId,
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  type config,
  tournamentChainId,
  tournamentFactoryAddress,
} from "@/shared/web3/config/wagmi";
import {
  type CreateTournamentValues,
  prizeWei,
  toTournamentParams,
} from "../schema/createTournament";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

/**
 * EIP-1167 minimal-proxy creation code for a clone of `implementation`, byte for
 * byte what {Clones.cloneDeterministic} feeds to CREATE2. Hashing it lets us
 * derive the clone's address client-side — no pre-sign RPC read. See
 * OpenZeppelin `Clones.sol`.
 */
function cloneInitCode(implementation: Address): Hex {
  const impl = implementation.slice(2).toLowerCase();
  return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${impl}5af43d82803e903d91602b57fd5bf3`;
}

/** Fresh 32 random bytes per submission (a new salt ⇒ a new CREATE2 address). */
function randomSalt(): Hex {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Owns all wallet/chain/transaction logic for creating a tournament: the signed
 * `createTournament` write (with the prize as `msg.value`), mining state, and
 * the client-side CREATE2 address prediction. The form stays presentational.
 *
 * @example
 * const { createTournament, busy } = useCreateTournament();
 * createTournament(validatedValues);
 */
export function useCreateTournament() {
  const { isConnected } = useConnection();
  const chainId = useChainId();
  const { mutate: switchChain } = useSwitchChain();
  const {
    mutate: writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const [predictedAddress, setPredictedAddress] = useState<Address | null>(
    null,
  );

  // `implementation` is immutable on the factory — wagmi caches it, so this
  // reads once and every prediction reuses it. Disabled until the factory
  // address is configured.
  const { data: implementation } = useReadContract({
    address: tournamentFactoryAddress,
    abi: tournamentFactoryAbi,
    functionName: "implementation",
    query: { enabled: Boolean(tournamentFactoryAddress) },
  });

  const wrongChain = isConnected && chainId !== tournamentChainId;
  const canSubmit = Boolean(tournamentFactoryAddress);
  const busy = isPending || isConfirming;

  function switchNetwork() {
    switchChain({ chainId: tournamentChainId as ConfiguredChainId });
  }

  function createTournament(values: CreateTournamentValues) {
    if (!tournamentFactoryAddress) return;
    const salt = randomSalt();
    const params = toTournamentParams(values);
    const value = prizeWei(values);

    // Predict the clone address before signing (pure fn of impl+salt+factory).
    const predicted = implementation
      ? getContractAddress({
          bytecode: cloneInitCode(implementation),
          from: tournamentFactoryAddress,
          opcode: "CREATE2",
          salt,
        })
      : null;
    setPredictedAddress(predicted);

    // Off-chain metadata; persisting it (name/image/description) is deferred.
    console.log("Creating tournament", {
      name: values.name,
      predictedAddress: predicted,
      salt,
    });

    writeContract({
      address: tournamentFactoryAddress,
      abi: tournamentFactoryAbi,
      functionName: "createTournament",
      args: [params, salt],
      value,
    });
  }

  return {
    isConnected,
    wrongChain,
    canSubmit,
    busy,
    isPending,
    isConfirming,
    isSuccess,
    error,
    predictedAddress,
    switchNetwork,
    createTournament,
  };
}
