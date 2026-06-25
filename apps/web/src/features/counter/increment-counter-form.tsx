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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { config, counterAddress, counterChainId } from "@/shared/web3/wagmi";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

export function IncrementCounterForm() {
  const router = useRouter();
  const { isConnected } = useConnection();
  const chainId = useChainId();
  const { mutate: switchChain } = useSwitchChain();
  const { mutate: writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Re-fetch the server-rendered count once the transaction is mined.
  useEffect(() => {
    if (isSuccess) router.refresh();
  }, [isSuccess, router]);

  const wrongChain = isConnected && chainId !== counterChainId;

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
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
      <p className="text-sm text-muted-foreground">
        Connect a wallet to increment the counter.
      </p>
    );
  }

  if (wrongChain) {
    return (
      <Button
        type="button"
        onClick={() =>
          switchChain({ chainId: counterChainId as ConfiguredChainId })
        }
        className="self-start"
      >
        Switch network
      </Button>
    );
  }

  const busy = isPending || isConfirming;

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        name="by"
        type="number"
        min={1}
        defaultValue={1}
        className="w-24"
      />
      <Button type="submit" disabled={busy || !counterAddress}>
        {isPending ? "Confirm in wallet…" : isConfirming ? "Mining…" : "Increment"}
      </Button>
      {error ? (
        <span className="self-center text-sm text-destructive">
          {error.message.split("\n")[0]}
        </span>
      ) : null}
    </form>
  );
}