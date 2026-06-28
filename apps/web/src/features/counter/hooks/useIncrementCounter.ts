"use client";

import { counterAbi } from "@arbiter/contracts";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useEffect } from "react";
import {
  useChainId,
  useConnection,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  type config,
  counterAddress,
  counterChainId,
} from "@/shared/web3/config/wagmi";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

/**
 * Owns all wallet/transaction logic for incrementing the on-chain counter:
 * connection + chain checks, the signed `incBy` write, mining state, and a
 * refresh of the server-rendered count once the tx is confirmed. The component
 * stays presentational.
 */
export function useIncrementCounter() {
  const router = useRouter();
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

  // Re-fetch the server-rendered count once the transaction is mined.
  useEffect(() => {
    if (isSuccess) router.refresh();
  }, [isSuccess, router]);

  const wrongChain = isConnected && chainId !== counterChainId;
  const busy = isPending || isConfirming;

  function switchNetwork() {
    switchChain({ chainId: counterChainId as ConfiguredChainId });
  }

  function increment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!counterAddress) return;
    const raw = new FormData(event.currentTarget).get("by");
    const by = BigInt(typeof raw === "string" && raw !== "" ? raw : "1");
    writeContract({
      address: counterAddress,
      abi: counterAbi,
      functionName: "incBy",
      args: [by],
    });
  }

  return {
    isConnected,
    wrongChain,
    canSubmit: Boolean(counterAddress),
    busy,
    isPending,
    isConfirming,
    error,
    switchNetwork,
    increment,
  };
}
