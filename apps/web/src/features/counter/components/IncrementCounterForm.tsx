"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncrementCounter } from "../hooks/useIncrementCounter";

export function IncrementCounterForm() {
  const {
    isConnected,
    wrongChain,
    canSubmit,
    busy,
    isPending,
    isConfirming,
    error,
    switchNetwork,
    increment,
  } = useIncrementCounter();

  if (!isConnected) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect a wallet to increment the counter.
      </p>
    );
  }

  if (wrongChain) {
    return (
      <Button type="button" onClick={switchNetwork} className="self-start">
        Switch network
      </Button>
    );
  }

  return (
    <form onSubmit={increment} className="flex gap-2">
      <Input
        name="by"
        type="number"
        min={1}
        defaultValue={1}
        className="w-24"
      />
      <Button type="submit" disabled={busy || !canSubmit}>
        {isPending
          ? "Confirm in wallet…"
          : isConfirming
            ? "Mining…"
            : "Increment"}
      </Button>
      {error ? (
        <span className="self-center text-sm text-destructive">
          {error.message.split("\n")[0]}
        </span>
      ) : null}
    </form>
  );
}
