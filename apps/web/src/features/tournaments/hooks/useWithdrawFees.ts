"use client";

import { tournamentAbi } from "@arbiter/contracts";
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
 * Owns the wallet/chain/transaction logic for the organizer withdrawing the
 * accumulated entry fees after the tournament completes (spec 007). A single
 * `withdrawFees()` write; the contract sends the full remaining balance and
 * reverts on a second call (`NoFeesToWithdraw`).
 */
export function useWithdrawFees(args: { tournamentAddress: Address }) {
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

  function withdrawFees() {
    writeContract({
      address: args.tournamentAddress,
      abi: tournamentAbi,
      functionName: "withdrawFees",
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
    isSuccess,
    errorMessage: voteErrorMessage(error),
    withdrawFees,
    switchNetwork,
  };
}
