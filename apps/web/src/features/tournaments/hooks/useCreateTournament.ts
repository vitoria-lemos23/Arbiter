"use client";

import { tournamentFactoryAbi } from "@arbiter/contracts";
import type { TournamentMetadataDoc } from "@arbiter/db";
import { useEffect, useRef, useState } from "react";
import { type Address, type Hex, toHex } from "viem";
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
import { saveTournamentMetadata } from "../actions/saveTournamentMetadata";
import { predictCloneAddress } from "../lib/predictCloneAddress";
import {
  type CreateTournamentValues,
  prizeWei,
  toTournamentParams,
} from "../schema/createTournament";
import { tournamentMetadataSchema } from "../schema/metadata";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

/** Fresh 32 random bytes per submission (a new salt means a new CREATE2 address). */
function randomSalt(): Hex {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Owns all wallet/chain/transaction logic for creating a tournament. The
 * organizer confirms a single transaction (the `createTournament` write, with
 * the prize as `msg.value`); once it mines, the off-chain presentation metadata
 * is persisted for the address the clone occupies. The form stays presentational.
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
    reset: resetWrite,
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
  // Metadata is persisted AFTER the tx mines (a single wallet prompt); the doc
  // collected at submit time is stashed until the receipt confirms.
  const [pendingMetadata, setPendingMetadata] =
    useState<TournamentMetadataDoc | null>(null);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const savedForHash = useRef<Hex | null>(null);

  // `implementation` is immutable on the factory, so wagmi caches this single
  // read and every prediction reuses it. Disabled until the address is set.
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

  // Clear the mined tx (so `hash`/`isSuccess` go back to idle), the predicted
  // address, and pending/errored metadata, letting the wizard leave the
  // success/error state.
  function reset() {
    resetWrite();
    setPredictedAddress(null);
    setPendingMetadata(null);
    setMetadataError(null);
    setIsSavingMetadata(false);
    savedForHash.current = null;
  }

  /** The off-chain presentation doc built from the collected wizard values. */
  function metadataDoc(values: CreateTournamentValues): TournamentMetadataDoc {
    return tournamentMetadataSchema.parse({
      name: values.name,
      description: values.description || undefined,
      game: values.game || undefined,
      imageUrl: values.imageUrl || undefined,
      tags: [],
    });
  }

  /**
   * Submit the creation tx: the only wallet prompt. The predicted CREATE2
   * address (a pure function of impl+salt+factory) is stashed so the success
   * screen and the post-mine metadata save can key off it.
   */
  function createTournament(values: CreateTournamentValues) {
    if (!tournamentFactoryAddress) return;
    setMetadataError(null);
    if (!implementation) {
      setMetadataError(
        "Reading factory implementation, try again in a moment.",
      );
      return;
    }
    const salt = randomSalt();
    const predicted = predictCloneAddress({
      implementation,
      factory: tournamentFactoryAddress,
      salt,
    });
    setPredictedAddress(predicted);
    setPendingMetadata(metadataDoc(values));

    writeContract({
      address: tournamentFactoryAddress,
      abi: tournamentFactoryAbi,
      functionName: "createTournament",
      args: [toTournamentParams(values), salt],
      value: prizeWei(values),
    });
  }

  // Persist metadata once the creation tx mines. Runs once per tx hash; a
  // failure leaves the on-chain tournament intact (details can be added later
  // via the edit flow) and surfaces a non-blocking error.
  useEffect(() => {
    if (!isSuccess || !hash || !predictedAddress || !pendingMetadata) return;
    if (savedForHash.current === hash) return;
    savedForHash.current = hash;
    const tournamentAddress = predictedAddress.toLowerCase() as `0x${string}`;
    setIsSavingMetadata(true);
    saveTournamentMetadata({
      tournamentAddress,
      metadata: pendingMetadata,
      txHash: hash,
    })
      .then((result) => {
        if (!result.ok) {
          setMetadataError(
            result.error ?? "Failed to save tournament details.",
          );
        }
      })
      .finally(() => setIsSavingMetadata(false));
  }, [isSuccess, hash, predictedAddress, pendingMetadata]);

  return {
    isConnected,
    wrongChain,
    canSubmit,
    busy,
    isSavingMetadata,
    isPending,
    isConfirming,
    isSuccess,
    error,
    metadataError,
    predictedAddress,
    switchNetwork,
    createTournament,
    reset,
  };
}
