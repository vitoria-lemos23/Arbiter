"use client";

import { tournamentFactoryAbi } from "@arbiter/contracts";
import type { TournamentMetadataDoc } from "@arbiter/db";
import { useState } from "react";
import { type Address, type Hex, toHex } from "viem";
import {
  useChainId,
  useConnection,
  useReadContract,
  useSignMessage,
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
import { buildMetadataMessage } from "../lib/metadataMessage";
import { predictCloneAddress } from "../lib/predictCloneAddress";
import {
  type CreateTournamentValues,
  prizeWei,
  toTournamentParams,
} from "../schema/createTournament";
import { tournamentMetadataSchema } from "../schema/metadata";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

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
  const { signMessageAsync } = useSignMessage();
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
  // Sign-then-save happens before the tx; its own pending + error state so the
  // wizard can block/label the Deploy button and surface metadata failures.
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

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
  const busy = isSavingMetadata || isPending || isConfirming;

  function switchNetwork() {
    switchChain({ chainId: tournamentChainId as ConfiguredChainId });
  }

  // Clear the mined tx (so `hash`/`isSuccess` go back to idle), the predicted
  // address, and any metadata error, letting the wizard leave the success/error
  // state.
  function reset() {
    resetWrite();
    setPredictedAddress(null);
    setMetadataError(null);
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
   * Persist signed metadata for the predicted address, then submit the creation
   * tx. Metadata is written BEFORE the tx (Business Rule #4): if the organizer
   * rejects the signature or the write fails, we abort without spending gas on a
   * detail-less tournament.
   */
  async function createTournament(values: CreateTournamentValues) {
    if (!tournamentFactoryAddress) return;
    setMetadataError(null);
    const salt = randomSalt();
    const params = toTournamentParams(values);
    const value = prizeWei(values);

    // Predict the clone address before signing (pure fn of impl+salt+factory);
    // metadata is keyed by it, so it must be known first.
    if (!implementation) {
      setMetadataError(
        "Reading factory implementation — try again in a moment.",
      );
      return;
    }
    const predicted = predictCloneAddress({
      implementation,
      factory: tournamentFactoryAddress,
      salt,
    });
    setPredictedAddress(predicted);

    const saved = await signAndSaveMetadata(predicted, metadataDoc(values));
    if (!saved) return;

    writeContract({
      address: tournamentFactoryAddress,
      abi: tournamentFactoryAbi,
      functionName: "createTournament",
      args: [params, salt],
      value,
    });
  }

  /** @returns true only when the metadata was signed and persisted. */
  async function signAndSaveMetadata(
    address: Address,
    metadata: TournamentMetadataDoc,
  ): Promise<boolean> {
    setIsSavingMetadata(true);
    try {
      const message = await buildMetadataMessage(address, metadata);
      let signature: `0x${string}`;
      try {
        signature = await signMessageAsync({ message });
      } catch {
        setMetadataError("Signature required to save tournament details.");
        return false;
      }
      const result = await saveTournamentMetadata({
        tournamentAddress: address.toLowerCase() as `0x${string}`,
        metadata,
        signature,
      });
      if (!result.ok) {
        setMetadataError(result.error ?? "Failed to save tournament details.");
        return false;
      }
      return true;
    } finally {
      setIsSavingMetadata(false);
    }
  }

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
