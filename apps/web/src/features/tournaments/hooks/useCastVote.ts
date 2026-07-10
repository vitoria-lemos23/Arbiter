"use client";

import { tournamentAbi } from "@arbiter/contracts";
import { useEffect } from "react";
import type { Address } from "viem";
import {
  useChainId,
  useConnection,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { type config, tournamentChainId } from "@/shared/web3/config/wagmi";
import { voteErrorMessage } from "../lib/voteErrorMessage";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

/**
 * Owns the wallet/chain/transaction logic for a judge casting a vote: a single
 * `castVote(matchIndex, player)` write. The match auto-resolves on-chain once a
 * majority agrees (spec 007), so there is no separate resolve call. `onSuccess`
 * fires once per confirmed tx — used to refetch the live vote breakdown.
 *
 * @example
 * const { castVote, busy } = useCastVote({ tournamentAddress, matchIndex, onSuccess });
 * castVote(playerA);
 */
export function useCastVote(args: {
  tournamentAddress: Address;
  matchIndex: number;
  onSuccess?: () => void;
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

  const { onSuccess } = args;
  useEffect(() => {
    if (isSuccess) onSuccess?.();
  }, [isSuccess, onSuccess]);

  function castVote(player: Address) {
    writeContract({
      address: args.tournamentAddress,
      abi: tournamentAbi,
      functionName: "castVote",
      args: [BigInt(args.matchIndex), player],
    });
  }

  function switchNetwork() {
    switchChain({ chainId: tournamentChainId as ConfiguredChainId });
  }

  return {
    address,
    isConnected,
    wrongChain: isConnected && chainId !== tournamentChainId,
    busy: isPending || isConfirming,
    isPending,
    isConfirming,
    isSuccess,
    errorMessage: voteErrorMessage(error),
    castVote,
    switchNetwork,
  };
}
