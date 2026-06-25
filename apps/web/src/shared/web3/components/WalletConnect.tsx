"use client";

import { Button } from "@/components/ui/button";
import { useWalletConnect } from "../hooks/useWalletConnect";

function shorten(address: `0x${string}`) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnect() {
  const { address, isConnected, connect, connectors, disconnect, isPending } =
    useWalletConnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono">{shorten(address)}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          type="button"
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? "Connecting…" : `Connect ${connector.name}`}
        </Button>
      ))}
    </div>
  );
}
