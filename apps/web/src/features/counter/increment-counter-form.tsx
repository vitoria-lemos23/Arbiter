"use client";

import { counterAbi } from "@arbiter/contracts";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { config, counterAddress, counterChainId } from "@/shared/web3/wagmi";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

export function IncrementCounterForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Re-fetch the server-rendered count once the transaction is mined.
  useEffect(() => {
    if (isSuccess) router.refresh();
  }, [isSuccess, router]);

  const wrongChain = isConnected && chainId !== counterChainId;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
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

  if (!isConnected) {
    return (
      <p className="text-sm text-gray-500">
        Connect a wallet to increment the counter.
      </p>
    );
  }

  if (wrongChain) {
    return (
      <button
        type="button"
        onClick={() =>
          switchChain({ chainId: counterChainId as ConfiguredChainId })
        }
        className="self-start rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        Switch network
      </button>
    );
  }

  const busy = isPending || isConfirming;

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        name="by"
        type="number"
        min={1}
        defaultValue={1}
        className="border rounded px-3 py-1.5 text-sm w-24"
      />
      <button
        type="submit"
        disabled={busy || !counterAddress}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet…" : isConfirming ? "Mining…" : "Increment"}
      </button>
      {error ? (
        <span className="self-center text-sm text-red-600">
          {error.message.split("\n")[0]}
        </span>
      ) : null}
    </form>
  );
}