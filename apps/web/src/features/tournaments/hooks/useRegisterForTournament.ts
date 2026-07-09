"use client";

import { tournamentAbi } from "@arbiter/contracts";
import { useEffect } from "react";
import type { Address } from "viem";
import {
  useChainId,
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { type config, tournamentChainId } from "@/shared/web3/config/wagmi";
import { registrationErrorMessage } from "../lib/registrationErrorMessage";
import {
  deriveRegistrationGate,
  type RegistrationGate,
} from "../lib/registrationGating";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

/**
 * Owns the wallet/chain/transaction logic for registering into a tournament:
 * a single `register()` write carrying the exact entry fee as `msg.value`.
 * Eligibility gating reads the on-chain views (`isRegistered`, `participantCount`)
 * so the UI updates the moment the tx mines, without waiting for the indexer
 * (spec 005, business rule 8). Immutable config (fee, capacity, start date)
 * comes from the indexed row via props.
 *
 * @example
 * const { gate, register, busy } = useRegisterForTournament({ ... });
 * if (gate === "open") register();
 */
export function useRegisterForTournament(args: {
  tournamentAddress: Address;
  entryFee: bigint;
  maxPlayers: number;
  startDate: Date;
}) {
  const { address, isConnected } = useConnection();
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

  // Pinned to the tournament's chain so gating reads work even while the
  // wallet is disconnected or on the wrong network.
  const readTarget = {
    address: args.tournamentAddress,
    abi: tournamentAbi,
    chainId: tournamentChainId as ConfiguredChainId,
  } as const;
  const { data: participantCount, refetch: refetchCount } = useReadContract({
    ...readTarget,
    functionName: "participantCount",
  });
  const { data: registeredOnChain, refetch: refetchRegistered } =
    useReadContract({
      ...readTarget,
      functionName: "isRegistered",
      args: address ? [address] : undefined,
      query: { enabled: Boolean(address) },
    });

  // Post-mine: refresh the on-chain views for instant gating (the roster list
  // catches up via the indexer).
  useEffect(() => {
    if (!isSuccess) return;
    refetchCount();
    refetchRegistered();
  }, [isSuccess, refetchCount, refetchRegistered]);

  const gate: RegistrationGate = deriveRegistrationGate({
    isConnected,
    chainId,
    requiredChainId: tournamentChainId,
    startDate: args.startDate,
    now: new Date(),
    participantCount,
    maxPlayers: args.maxPlayers,
    alreadyRegistered: Boolean(registeredOnChain) || isSuccess,
  });
  const busy = isPending || isConfirming;

  function switchNetwork() {
    switchChain({ chainId: tournamentChainId as ConfiguredChainId });
  }

  /** Send the registration tx with the exact entry fee (0n for free events). */
  function register() {
    writeContract({
      address: args.tournamentAddress,
      abi: tournamentAbi,
      functionName: "register",
      value: args.entryFee,
    });
  }

  return {
    gate,
    canSubmit: gate === "open" && !busy,
    busy,
    isPending,
    isConfirming,
    isSuccess,
    participantCount,
    errorMessage: registrationErrorMessage(error),
    register,
    switchNetwork,
  };
}
